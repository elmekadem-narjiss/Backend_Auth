import { simulatePrice, updateEnergyPrice, getLatestPrice, checkAndExecuteTrade, executeManualTrade, getTransactions } from '../../src/services/energyProviderService';
import { query } from '../../src/config/postgres';
import logger from '../../src/config/logger';
import { Job } from 'bullmq';
import 'mocha';
import assert from 'assert';
import sinon from 'sinon';
import fetch from 'node-fetch';

// Définir le type attendu pour les résultats de query
type QueryResult<T> = T[] | { rows: T[] };

describe('Energy Provider Service', () => {
  let queryStub: sinon.SinonStub;
  let fetchStub: sinon.SinonStub;
  let loggerInfoStub: sinon.SinonStub;

  beforeEach(() => {
    queryStub = sinon.stub();
    fetchStub = sinon.stub();
    loggerInfoStub = sinon.stub(logger, 'info');
    sinon.replace({ query }, 'query', queryStub);
    sinon.replace({ fetch }, 'fetch', fetchStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('simulatePrice', () => {
    it('should return a price between 0.03 and 0.05 for hours 0-5', () => {
      const price = simulatePrice(3);
      assert(price >= 0.03 && price <= 0.05, `Price ${price} should be between 0.03 and 0.05`);
    });

    it('should return a price between 0.06 and 0.09 for hours 6-16', () => {
      const price = simulatePrice(10);
      assert(price >= 0.06 && price <= 0.09, `Price ${price} should be between 0.06 and 0.09`);
    });

    it('should return a price between 0.10 and 0.15 for hours 17-23', () => {
      const price = simulatePrice(18);
      assert(price >= 0.10 && price <= 0.15, `Price ${price} should be between 0.10 and 0.15`);
    });
  });

  describe('updateEnergyPrice', () => {
    it('should insert a simulated price into the database', async () => {
      const now = new Date();
      sinon.stub(Date.prototype, 'getHours').returns(3);
      queryStub.resolves([{ time: now, price: 0.04 }]);
      const price = await updateEnergyPrice();
      assert(price >= 0.03 && price <= 0.05, `Price ${price} should be between 0.03 and 0.05`);
      sinon.assert.calledWith(queryStub, 'INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]);
      sinon.assert.calledWith(loggerInfoStub, `Prix simulé à ${now.toISOString()}: ${price} €/kWh`);
    });

    it('should throw an error if the query fails', async () => {
      queryStub.rejects(new Error('Database error'));
      await assert.rejects(
        async () => await updateEnergyPrice(),
        { message: 'Database error' }
      );
    });
  });

  describe('getLatestPrice', () => {
    it('should return the latest price from the database (array result)', async () => {
      queryStub.resolves([{ price: 0.04 }]);
      const price = await getLatestPrice();
      assert.strictEqual(price, 0.04);
      sinon.assert.calledWith(queryStub, 'SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
    });

    it('should return the latest price from the database (rows result)', async () => {
      queryStub.resolves({ rows: [{ price: 0.04 }] });
      const price = await getLatestPrice();
      assert.strictEqual(price, 0.04);
      sinon.assert.calledWith(queryStub, 'SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
    });

    it('should return default price if no data is available', async () => {
      queryStub.resolves([]);
      const price = await getLatestPrice();
      assert.strictEqual(price, 0.05);
    });

    it('should throw an error if the query fails', async () => {
      queryStub.rejects(new Error('Database error'));
      await assert.rejects(
        async () => await getLatestPrice(),
        { message: 'Database error' }
      );
    });
  });

  describe('checkAndExecuteTrade', () => {
    let job: Job;

    beforeEach(() => {
      job = { id: '1', data: {} } as Job;
      sinon.stub({ getLatestPrice }, 'getLatestPrice').resolves(0.04);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 30 } }),
      } as Response);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should execute a buy transaction if conditions are met', async () => {
      queryStub.resolves([{ type: 'buy', quantity: 9.5, price: 0.04, profit: 0 }]);
      await checkAndExecuteTrade(job);
      sinon.assert.calledWith(
        queryStub,
        'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *',
        ['buy', 9.5, 0.04, 0]
      );
      sinon.assert.calledWith(loggerInfoStub, 'Transaction buy exécutée: 9.5 kWh à 0.04 €/kWh, profit: 0');
    });

    it('should execute a sell transaction if conditions are met', async () => {
      sinon.stub({ getLatestPrice }, 'getLatestPrice').resolves(0.13);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 70 } }),
      } as Response);
      queryStub.resolves([{ type: 'sell', quantity: 9.5, price: 0.13, profit: 0.855 }]);
      await checkAndExecuteTrade(job);
      sinon.assert.calledWith(
        queryStub,
        'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *',
        ['sell', 9.5, 0.13, 0.855]
      );
      sinon.assert.calledWith(loggerInfoStub, 'Transaction sell exécutée: 9.5 kWh à 0.13 €/kWh, profit: 0.855');
    });

    it('should not execute a transaction if conditions are not met', async () => {
      sinon.stub({ getLatestPrice }, 'getLatestPrice').resolves(0.06);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 50 } }),
      } as Response);
      await checkAndExecuteTrade(job);
      sinon.assert.notCalled(queryStub.withArgs('INSERT INTO Transactions'));
    });

    it('should throw an error if fetch fails', async () => {
      fetchStub.resolves({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);
      await assert.rejects(
        async () => await checkAndExecuteTrade(job),
        { message: 'Failed to fetch SOC: 500 Internal Server Error' }
      );
    });
  });

  describe('executeManualTrade', () => {
    beforeEach(() => {
      sinon.stub({ getLatestPrice }, 'getLatestPrice').resolves(0.04);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 30 } }),
      } as Response);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should execute a buy transaction if conditions are met', async () => {
      queryStub.resolves([{ type: 'buy', quantity: 5, price: 0.04, profit: 0 }]);
      const result = await executeManualTrade('buy', 5);
      assert.strictEqual(result.quantity, 5);
      assert.strictEqual(result.price, 0.04);
      sinon.assert.calledWith(
        queryStub,
        'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *',
        ['buy', 5, 0.04, 0]
      );
      sinon.assert.calledWith(loggerInfoStub, 'Transaction manuelle buy: 5 kWh à 0.04 €/kWh, profit: 0');
    });

    it('should execute a sell transaction if conditions are met', async () => {
      sinon.stub({ getLatestPrice }, 'getLatestPrice').resolves(0.13);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 70 } }),
      } as Response);
      queryStub.resolves([{ type: 'sell', quantity: 5, price: 0.13, profit: 0.4 }]);
      const result = await executeManualTrade('sell', 5);
      assert.strictEqual(result.quantity, 5);
      assert.strictEqual(result.price, 0.13);
      sinon.assert.calledWith(
        queryStub,
        'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *',
        ['sell', 5, 0.13, 0.4]
      );
      sinon.assert.calledWith(loggerInfoStub, 'Transaction manuelle sell: 5 kWh à 0.13 €/kWh, profit: 0.4');
    });

    it('should throw an error if buy conditions are not met', async () => {
      sinon.stub({ getLatestPrice }, 'getLatestPrice').resolves(0.06);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 80 } }),
      } as Response);
      await assert.rejects(
        async () => await executeManualTrade('buy', 5),
        { message: 'Conditions d\'achat non remplies' }
      );
    });

    it('should throw an error if sell conditions are not met', async () => {
      sinon.stub({ getLatestPrice }, 'getLatestPrice').resolves(0.11);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 50 } }),
      } as Response);
      await assert.rejects(
        async () => await executeManualTrade('sell', 5),
        { message: 'Conditions de vente non remplies' }
      );
    });

    it('should throw an error if fetch fails', async () => {
      fetchStub.resolves({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      } as Response);
      await assert.rejects(
        async () => await executeManualTrade('buy', 5),
        { message: 'Failed to fetch SOC: 500 Internal Server Error - Response: Server error' }
      );
    });
  });

  describe('getTransactions', () => {
    it('should return a list of transactions (array result)', async () => {
      queryStub.resolves([{ id: 1, type: 'buy', quantity: 5, price: 0.04 }]);
      const transactions = await getTransactions();
      assert.strictEqual(transactions.length, 1);
      assert.strictEqual(transactions[0].quantity, 5);
      sinon.assert.calledWith(queryStub, 'SELECT * FROM Transactions ORDER BY created_at DESC');
    });

    it('should return a list of transactions (rows result)', async () => {
      queryStub.resolves({ rows: [{ id: 1, type: 'buy', quantity: 5, price: 0.04 }] });
      const transactions = await getTransactions();
      assert.strictEqual(transactions.length, 1);
      assert.strictEqual(transactions[0].quantity, 5);
      sinon.assert.calledWith(queryStub, 'SELECT * FROM Transactions ORDER BY created_at DESC');
    });

    it('should throw an error if the query fails', async () => {
      queryStub.rejects(new Error('Query failed'));
      await assert.rejects(
        async () => await getTransactions(),
        { message: 'Query failed' }
      );
    });
  });
});