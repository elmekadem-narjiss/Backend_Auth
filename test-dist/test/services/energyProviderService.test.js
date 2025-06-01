"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const energyProviderService_1 = require("../../src/services/energyProviderService");
const postgres_1 = require("../../src/config/postgres");
const logger_1 = __importDefault(require("../../src/config/logger"));
require("mocha");
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const node_fetch_1 = __importDefault(require("node-fetch"));
describe('Energy Provider Service', () => {
    let queryStub;
    let fetchStub;
    let loggerInfoStub;
    beforeEach(() => {
        queryStub = sinon_1.default.stub();
        fetchStub = sinon_1.default.stub();
        loggerInfoStub = sinon_1.default.stub(logger_1.default, 'info');
        sinon_1.default.replace({ query: postgres_1.query }, 'query', queryStub);
        sinon_1.default.replace({ fetch: node_fetch_1.default }, 'fetch', fetchStub);
    });
    afterEach(() => {
        sinon_1.default.restore();
    });
    describe('simulatePrice', () => {
        it('should return a price between 0.03 and 0.05 for hours 0-5', () => {
            const price = (0, energyProviderService_1.simulatePrice)(3);
            (0, assert_1.default)(price >= 0.03 && price <= 0.05, `Price ${price} should be between 0.03 and 0.05`);
        });
        it('should return a price between 0.06 and 0.09 for hours 6-16', () => {
            const price = (0, energyProviderService_1.simulatePrice)(10);
            (0, assert_1.default)(price >= 0.06 && price <= 0.09, `Price ${price} should be between 0.06 and 0.09`);
        });
        it('should return a price between 0.10 and 0.15 for hours 17-23', () => {
            const price = (0, energyProviderService_1.simulatePrice)(18);
            (0, assert_1.default)(price >= 0.10 && price <= 0.15, `Price ${price} should be between 0.10 and 0.15`);
        });
    });
    describe('updateEnergyPrice', () => {
        it('should insert a simulated price into the database', async () => {
            const now = new Date();
            sinon_1.default.stub(Date.prototype, 'getHours').returns(3);
            queryStub.resolves([{ time: now, price: 0.04 }]);
            const price = await (0, energyProviderService_1.updateEnergyPrice)();
            (0, assert_1.default)(price >= 0.03 && price <= 0.05, `Price ${price} should be between 0.03 and 0.05`);
            sinon_1.default.assert.calledWith(queryStub, 'INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]);
            sinon_1.default.assert.calledWith(loggerInfoStub, `Prix simulé à ${now.toISOString()}: ${price} €/kWh`);
        });
        it('should throw an error if the query fails', async () => {
            queryStub.rejects(new Error('Database error'));
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.updateEnergyPrice)(), { message: 'Database error' });
        });
    });
    describe('getLatestPrice', () => {
        it('should return the latest price from the database (array result)', async () => {
            queryStub.resolves([{ price: 0.04 }]);
            const price = await (0, energyProviderService_1.getLatestPrice)();
            assert_1.default.strictEqual(price, 0.04);
            sinon_1.default.assert.calledWith(queryStub, 'SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
        });
        it('should return the latest price from the database (rows result)', async () => {
            queryStub.resolves({ rows: [{ price: 0.04 }] });
            const price = await (0, energyProviderService_1.getLatestPrice)();
            assert_1.default.strictEqual(price, 0.04);
            sinon_1.default.assert.calledWith(queryStub, 'SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
        });
        it('should return default price if no data is available', async () => {
            queryStub.resolves([]);
            const price = await (0, energyProviderService_1.getLatestPrice)();
            assert_1.default.strictEqual(price, 0.05);
        });
        it('should throw an error if the query fails', async () => {
            queryStub.rejects(new Error('Database error'));
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.getLatestPrice)(), { message: 'Database error' });
        });
    });
    describe('checkAndExecuteTrade', () => {
        let job;
        beforeEach(() => {
            job = { id: '1', data: {} };
            sinon_1.default.stub({ getLatestPrice: energyProviderService_1.getLatestPrice }, 'getLatestPrice').resolves(0.04);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 30 } }),
            });
        });
        afterEach(() => {
            sinon_1.default.restore();
        });
        it('should execute a buy transaction if conditions are met', async () => {
            queryStub.resolves([{ type: 'buy', quantity: 9.5, price: 0.04, profit: 0 }]);
            await (0, energyProviderService_1.checkAndExecuteTrade)(job);
            sinon_1.default.assert.calledWith(queryStub, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 9.5, 0.04, 0]);
            sinon_1.default.assert.calledWith(loggerInfoStub, 'Transaction buy exécutée: 9.5 kWh à 0.04 €/kWh, profit: 0');
        });
        it('should execute a sell transaction if conditions are met', async () => {
            sinon_1.default.stub({ getLatestPrice: energyProviderService_1.getLatestPrice }, 'getLatestPrice').resolves(0.13);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 70 } }),
            });
            queryStub.resolves([{ type: 'sell', quantity: 9.5, price: 0.13, profit: 0.855 }]);
            await (0, energyProviderService_1.checkAndExecuteTrade)(job);
            sinon_1.default.assert.calledWith(queryStub, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 9.5, 0.13, 0.855]);
            sinon_1.default.assert.calledWith(loggerInfoStub, 'Transaction sell exécutée: 9.5 kWh à 0.13 €/kWh, profit: 0.855');
        });
        it('should not execute a transaction if conditions are not met', async () => {
            sinon_1.default.stub({ getLatestPrice: energyProviderService_1.getLatestPrice }, 'getLatestPrice').resolves(0.06);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 50 } }),
            });
            await (0, energyProviderService_1.checkAndExecuteTrade)(job);
            sinon_1.default.assert.notCalled(queryStub.withArgs('INSERT INTO Transactions'));
        });
        it('should throw an error if fetch fails', async () => {
            fetchStub.resolves({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.checkAndExecuteTrade)(job), { message: 'Failed to fetch SOC: 500 Internal Server Error' });
        });
    });
    describe('executeManualTrade', () => {
        beforeEach(() => {
            sinon_1.default.stub({ getLatestPrice: energyProviderService_1.getLatestPrice }, 'getLatestPrice').resolves(0.04);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 30 } }),
            });
        });
        afterEach(() => {
            sinon_1.default.restore();
        });
        it('should execute a buy transaction if conditions are met', async () => {
            queryStub.resolves([{ type: 'buy', quantity: 5, price: 0.04, profit: 0 }]);
            const result = await (0, energyProviderService_1.executeManualTrade)('buy', 5);
            assert_1.default.strictEqual(result.quantity, 5);
            assert_1.default.strictEqual(result.price, 0.04);
            sinon_1.default.assert.calledWith(queryStub, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 5, 0.04, 0]);
            sinon_1.default.assert.calledWith(loggerInfoStub, 'Transaction manuelle buy: 5 kWh à 0.04 €/kWh, profit: 0');
        });
        it('should execute a sell transaction if conditions are met', async () => {
            sinon_1.default.stub({ getLatestPrice: energyProviderService_1.getLatestPrice }, 'getLatestPrice').resolves(0.13);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 70 } }),
            });
            queryStub.resolves([{ type: 'sell', quantity: 5, price: 0.13, profit: 0.4 }]);
            const result = await (0, energyProviderService_1.executeManualTrade)('sell', 5);
            assert_1.default.strictEqual(result.quantity, 5);
            assert_1.default.strictEqual(result.price, 0.13);
            sinon_1.default.assert.calledWith(queryStub, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 5, 0.13, 0.4]);
            sinon_1.default.assert.calledWith(loggerInfoStub, 'Transaction manuelle sell: 5 kWh à 0.13 €/kWh, profit: 0.4');
        });
        it('should throw an error if buy conditions are not met', async () => {
            sinon_1.default.stub({ getLatestPrice: energyProviderService_1.getLatestPrice }, 'getLatestPrice').resolves(0.06);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 80 } }),
            });
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.executeManualTrade)('buy', 5), { message: 'Conditions d\'achat non remplies' });
        });
        it('should throw an error if sell conditions are not met', async () => {
            sinon_1.default.stub({ getLatestPrice: energyProviderService_1.getLatestPrice }, 'getLatestPrice').resolves(0.11);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 50 } }),
            });
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.executeManualTrade)('sell', 5), { message: 'Conditions de vente non remplies' });
        });
        it('should throw an error if fetch fails', async () => {
            fetchStub.resolves({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'Server error',
            });
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.executeManualTrade)('buy', 5), { message: 'Failed to fetch SOC: 500 Internal Server Error - Response: Server error' });
        });
    });
    describe('getTransactions', () => {
        it('should return a list of transactions (array result)', async () => {
            queryStub.resolves([{ id: 1, type: 'buy', quantity: 5, price: 0.04 }]);
            const transactions = await (0, energyProviderService_1.getTransactions)();
            assert_1.default.strictEqual(transactions.length, 1);
            assert_1.default.strictEqual(transactions[0].quantity, 5);
            sinon_1.default.assert.calledWith(queryStub, 'SELECT * FROM Transactions ORDER BY created_at DESC');
        });
        it('should return a list of transactions (rows result)', async () => {
            queryStub.resolves({ rows: [{ id: 1, type: 'buy', quantity: 5, price: 0.04 }] });
            const transactions = await (0, energyProviderService_1.getTransactions)();
            assert_1.default.strictEqual(transactions.length, 1);
            assert_1.default.strictEqual(transactions[0].quantity, 5);
            sinon_1.default.assert.calledWith(queryStub, 'SELECT * FROM Transactions ORDER BY created_at DESC');
        });
        it('should throw an error if the query fails', async () => {
            queryStub.rejects(new Error('Query failed'));
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.getTransactions)(), { message: 'Query failed' });
        });
    });
});
