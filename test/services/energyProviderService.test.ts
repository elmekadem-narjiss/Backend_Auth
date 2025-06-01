import { simulatePrice, updateEnergyPrice, getLatestPrice, checkAndExecuteTrade, executeManualTrade, getTransactions } from '../../src/services/energyProviderService';
import logger from '../../src/config/logger';
import { Job } from 'bullmq';
import 'mocha';
import assert from 'assert';
import sinon from 'sinon';
import fetch, { Response } from 'node-fetch';

type QueryResult<T> = T[] | { rows: T[] };
type QueryFunction = (text: string, params?: any[]) => Promise<QueryResult<any>>;

describe('Energy Provider Service', () => {
  let sandbox: sinon.SinonSandbox;
  let fetchStub: sinon.SinonStub;
  let loggerInfoStub: sinon.SinonStub;
  let mockQuery: sinon.SinonStub<[string, any[]?], Promise<QueryResult<any>>>;

  beforeEach(() => {
    console.log('Starting beforeEach: Initializing sandbox and stubs');
    sandbox = sinon.createSandbox();
    fetchStub = sandbox.stub(fetch, 'default') as sinon.SinonStub;
    loggerInfoStub = sandbox.stub(logger, 'info');
    console.log('Creating mockQuery before stub:', mockQuery);
    mockQuery = sandbox.stub();
    console.log('Created mockQuery after stub:', mockQuery);
  });

  afterEach(() => {
    console.log('Restoring sandbox after each test');
    sandbox.restore();
  });

  describe('simulatePrice', () => {
    it('should return a price between 0.03 and 0.05 for hours 0-5', () => {
      console.log('Running test: should return a price between 0.03 and 0.05');
      const price = simulatePrice(3);
      assert(price >= 0.03 && price <= 0.05, `Price ${price} should be between 0.03 and 0.05`);
    });

    it('should return a price between 0.06 and 0.09 for hours 6-16', () => {
      console.log('Running test: should return a price between 0.06 and 0.09');
      const price = simulatePrice(10);
      assert(price >= 0.06 && price <= 0.09, `Price ${price} should be between 0.06 and 0.09`);
    });

    it('should return a price between 0.10 and 0.15 for hours 17-23', () => {
      console.log('Running test: should return a price between 0.10 and 0.15');
      const price = simulatePrice(18);
      assert(price >= 0.10 && price <= 0.15, `Price ${price} should be between 0.10 and 0.15`);
    });
  });

  describe('updateEnergyPrice', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      console.log('Starting beforeEach: Initializing clock for updateEnergyPrice');
      mockQuery = sandbox.stub();
      clock = sinon.useFakeTimers(new Date('2025-06-01T03:00:00Z').getTime());
    });

    afterEach(() => {
      console.log('Restoring clock after each test');
      clock.restore();
    });

    it('should insert a simulated price into the database', async () => {
      console.log('Running test: should insert a simulated price');
      const now = new Date('2025-06-01T03:00:00Z');
      sandbox.stub(Math, 'random').returns(0.5); // Simuler un prix fixe : 0.04
      const price = simulatePrice(3);
      mockQuery.withArgs('INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]).resolves([{ time: now, price }]);
      const result = await updateEnergyPrice(mockQuery);
      assert.strictEqual(result, price, `Price ${result} should match simulated price ${price}`);
      sandbox.assert.calledWith(mockQuery, 'INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]);
      sandbox.assert.calledWith(loggerInfoStub, `Prix simulé à ${now.toISOString()}: ${price} €/kWh`);
    });

    it('should throw an error if the query fails', async () => {
      console.log('Running test: should throw an error if the query fails');
      mockQuery.rejects(new Error('Database error'));
      await assert.rejects(
        async () => await updateEnergyPrice(mockQuery),
        (err: Error) => err.message === 'Database error'
      );
    });
  });

  describe('getLatestPrice', () => {
    it('should return the latest price from the database (array result)', async () => {
      console.log('Running test: should return the latest price (array result)');
      mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves([{ price: 0.04 }]);
      const price = await getLatestPrice(mockQuery);
      assert.strictEqual(price, 0.04);
      sandbox.assert.calledWith(mockQuery, 'SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
    });

    it('should return the latest price from the database (rows result)', async () => {
      console.log('Running test: should return the latest price (rows result)');
      mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves({ rows: [{ price: 0.04 }] });
      const price = await getLatestPrice(mockQuery);
      assert.strictEqual(price, 0.04);
      sandbox.assert.calledWith(mockQuery, 'SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
    });

    it('should return default price if no data is available', async () => {
      console.log('Running test: should return default price if no data');
      mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves([]);
      const price = await getLatestPrice(mockQuery);
      assert.strictEqual(price, 0.05);
    });

    it('should throw an error if the query fails', async () => {
      console.log('Running test: should throw an error if the query fails');
      mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').rejects(new Error('Database error'));
      await assert.rejects(
        async () => await getLatestPrice(mockQuery),
        { message: 'Failed to fetch price data' }
      );
    });
  });

  describe('checkAndExecuteTrade', () => {
    let job: Job;

    beforeEach(() => {
      console.log('Setting up checkAndExecuteTrade beforeEach');
      job = { id: '1', data: {} } as Job;
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 70 } }),
      } as Response);
    });

    it('should execute a buy transaction if conditions are met', async () => {
      console.log('Running test: should execute a buy transaction');
      const mockGetLatestPrice = sandbox.stub().resolves(0.04);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 40 } }),
      } as Response);
      mockQuery.withArgs('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 9.5, 0.04, 0]).resolves([{ type: 'buy', quantity: 9.5, price: 0.04, profit: 0 }]);
      await checkAndExecuteTrade(job, mockQuery, mockGetLatestPrice);
      sandbox.assert.calledWith(mockQuery, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 9.5, 0.04, 0]);
      sandbox.assert.calledWith(loggerInfoStub, 'Transaction buy exécutée: 9.5 kWh à 0.04 €/kWh, profit: 0');
    });

    it('should execute a sell transaction if conditions are met', async () => {
      console.log('Running test: should execute a sell transaction');
      const mockGetLatestPrice = sandbox.stub().resolves(0.13);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 70 } }),
      } as Response);
      const profit = 9.5 * (0.13 - 0.05);
      mockQuery.withArgs('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 9.5, 0.13, profit]).resolves([{ type: 'sell', quantity: 9.5, price: 0.13, profit }]);
      await checkAndExecuteTrade(job, mockQuery, mockGetLatestPrice);
      sandbox.assert.calledWith(mockQuery, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 9.5, 0.13, profit]);
      sandbox.assert.calledWith(loggerInfoStub, `Transaction sell exécutée: 9.5 kWh à 0.13 €/kWh, profit: ${profit}`);
    });

    it('should not execute a transaction if conditions are not met', async () => {
      console.log('Running test: should not execute a transaction if conditions are not met');
      const mockGetLatestPrice = sandbox.stub().resolves(0.06);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 50 } }),
      } as Response);
      await checkAndExecuteTrade(job, mockQuery, mockGetLatestPrice);
      sandbox.assert.notCalled(mockQuery.withArgs('INSERT INTO Transactions'));
    });

    it('should throw an error if fetch fails', async () => {
      console.log('Running test: should throw an error if fetch fails');
      mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves([{ price: 0.04 }]);
      fetchStub.resolves({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);
      await assert.rejects(
        async () => await checkAndExecuteTrade(job, mockQuery),
        (err: Error) => err.message === 'Failed to fetch SOC: Internal Server Error'
      );
    });
  });

  describe('executeManualTrade', () => {
    it('should execute a buy transaction if conditions are met', async () => {
      console.log('Running test: should execute a buy transaction');
      const mockGetLatestPrice = sandbox.stub().resolves(0.04);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 30 } }),
      } as Response);
      mockQuery.withArgs('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 5, 0.04, 0]).resolves([{ type: 'buy', quantity: 5, price: 0.04, profit: 0 }]);
      const result = await executeManualTrade('buy', 5, mockQuery, mockGetLatestPrice);
      assert.strictEqual(result.quantity, 5);
      assert.strictEqual(result.price, 0.04);
      sandbox.assert.calledWith(mockQuery, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 5, 0.04, 0]);
      sandbox.assert.calledWith(loggerInfoStub, 'Transaction manuelle buy: 5 kWh à 0.04 €/kWh, profit: 0');
    });

    it('should execute a sell transaction if conditions are met', async () => {
      console.log('Running test: should execute a sell transaction');
      const mockGetLatestPrice = sandbox.stub().resolves(0.13);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 70 } }),
      } as Response);
      const profit = 5 * (0.13 - 0.05);
      mockQuery.withArgs('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 5, 0.13, profit]).resolves([{ type: 'sell', quantity: 5, price: 0.13, profit }]);
      const result = await executeManualTrade('sell', 5, mockQuery, mockGetLatestPrice);
      assert.strictEqual(result.quantity, 5);
      assert.strictEqual(result.price, 0.13);
      sandbox.assert.calledWith(mockQuery, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 5, 0.13, profit]);
      sandbox.assert.calledWith(loggerInfoStub, `Transaction manuelle sell: 5 kWh à 0.13 €/kWh, profit: ${profit}`);
    });

    it('should throw an error if buy conditions are not met', async () => {
      console.log('Running test: should throw an error if buy conditions are not met');
      const mockGetLatestPrice = sandbox.stub().resolves(0.06);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 80 } }),
      } as Response);
      await assert.rejects(
        async () => await executeManualTrade('buy', 5, mockQuery, mockGetLatestPrice),
        { message: 'Conditions d\'achat non remplies' }
      );
    });

    it('should throw an error if sell conditions are not met', async () => {
      console.log('Running test: should throw an error if sell conditions are not met');
      const mockGetLatestPrice = sandbox.stub().resolves(0.11);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ metrics: { soc_final: 50 } }),
      } as Response);
      await assert.rejects(
        async () => await executeManualTrade('sell', 5, mockQuery, mockGetLatestPrice),
        { message: 'Conditions de vente non remplies' }
      );
    });

    it('should throw an error if fetch fails', async () => {
      console.log('Running test: should throw an error if fetch fails');
      mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves([{ price: 0.04 }]);
      fetchStub.resolves({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      } as Response);
      await assert.rejects(
        async () => await executeManualTrade('buy', 5, mockQuery),
        (err: Error) => err.message === 'Failed to fetch SOC: Internal Server Error'
      );
    });
  });

  describe('getTransactions', () => {
    it('should return a list of transactions (array result)', async () => {
      console.log('Running test: should return a list of transactions (array result)');
      mockQuery.withArgs('SELECT * FROM Transactions ORDER BY created_at DESC').resolves([{ id: 1, type: 'buy', quantity: 5, price: 0.04 }]);
      const transactions = await getTransactions(mockQuery);
      assert.strictEqual(transactions.length, 1);
      assert.strictEqual(transactions[0].quantity, 5);
      sandbox.assert.calledWith(mockQuery, 'SELECT * FROM Transactions ORDER BY created_at DESC');
    });

    it('should return a list of transactions (rows result)', async () => {
      console.log('Running test: should return a list of transactions (rows result)');
      mockQuery.withArgs('SELECT * FROM Transactions ORDER BY created_at DESC').resolves({ rows: [{ id: 1, type: 'buy', quantity: 5, price: 0.04 }] });
      const transactions = await getTransactions(mockQuery);
      assert.strictEqual(transactions.length, 1);
      assert.strictEqual(transactions[0].quantity, 5);
      sandbox.assert.calledWith(mockQuery, 'SELECT * FROM Transactions ORDER BY created_at DESC');
    });

    it('should throw an error if the query fails', async () => {
      console.log('Running test: should throw an error if the query fails');
      mockQuery.withArgs('SELECT * FROM Transactions ORDER BY created_at DESC').rejects(new Error('Query failed'));
      await assert.rejects(
        async () => await getTransactions(mockQuery),
        { message: 'Query failed' }
      );
    });
  });
});