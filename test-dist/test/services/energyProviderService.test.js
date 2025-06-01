"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const energyProviderService_1 = require("../../src/services/energyProviderService");
const logger_1 = __importDefault(require("../../src/config/logger"));
require("mocha");
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const node_fetch_1 = __importDefault(require("node-fetch"));
describe('Energy Provider Service', () => {
    let sandbox;
    let fetchStub;
    let loggerInfoStub;
    let mockQuery;
    beforeEach(() => {
        console.log('Starting beforeEach: Initializing sandbox and stubs');
        sandbox = sinon_1.default.createSandbox();
        fetchStub = sandbox.stub(node_fetch_1.default, 'default');
        loggerInfoStub = sandbox.stub(logger_1.default, 'info');
        mockQuery = sandbox.stub();
    });
    afterEach(() => {
        console.log('Restoring sandbox after each test');
        sandbox.restore();
    });
    describe('simulatePrice', () => {
        it('should return a price between 0.03 and 0.05 for hours 0-5', () => {
            console.log('Running test: should return a price between 0.03 and 0.05');
            const price = (0, energyProviderService_1.simulatePrice)(3, false, 'test-seed'); // Utilise une graine fixe pour reproductibilité
            (0, assert_1.default)(price >= 0.03 && price <= 0.05, `Price ${price} should be between 0.03 and 0.05`);
        });
        it('should return a price between 0.06 and 0.09 for hours 6-16', () => {
            console.log('Running test: should return a price between 0.06 and 0.09');
            const price = (0, energyProviderService_1.simulatePrice)(10, false, 'test-seed');
            (0, assert_1.default)(price >= 0.06 && price <= 0.09, `Price ${price} should be between 0.06 and 0.09`);
        });
        it('should return a price between 0.10 and 0.15 for hours 17-23', () => {
            console.log('Running test: should return a price between 0.10 and 0.15');
            const price = (0, energyProviderService_1.simulatePrice)(18, false, 'test-seed');
            (0, assert_1.default)(price >= 0.10 && price <= 0.15, `Price ${price} should be between 0.10 and 0.15`);
        });
    });
    describe('updateEnergyPrice', () => {
        let clock;
        beforeEach(() => {
            console.log('Starting beforeEach: Initializing clock for updateEnergyPrice');
            mockQuery = sandbox.stub();
            clock = sinon_1.default.useFakeTimers(new Date('2025-06-01T03:00:00Z').getTime());
        });
        afterEach(() => {
            console.log('Restoring clock after each test');
            clock.restore();
        });
        it('should insert a simulated price into the database', async () => {
            console.log('Running test: should insert a simulated price');
            const now = new Date('2025-06-01T03:00:00Z');
            const price = (0, energyProviderService_1.simulatePrice)(3, false, 'test-seed'); // Prix fixe avec graine
            mockQuery.withArgs('INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]).resolves([{ time: now, price }]);
            const result = await (0, energyProviderService_1.updateEnergyPrice)(mockQuery);
            assert_1.default.strictEqual(result, price, `Price ${result} should match simulated price ${price}`);
            sandbox.assert.calledWith(mockQuery, 'INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]);
            sandbox.assert.calledWith(loggerInfoStub, `Prix simulé à ${now.toISOString()}: ${price} €/kWh`);
        });
        it('should throw an error if the query fails', async () => {
            console.log('Running test: should throw an error if the query fails');
            mockQuery.rejects(new Error('Database error'));
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.updateEnergyPrice)(mockQuery), (err) => err.message === 'Database error');
        });
    });
    describe('getLatestPrice', () => {
        it('should return the latest price from the database (array result)', async () => {
            console.log('Running test: should return the latest price (array result)');
            mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves([{ price: 0.04 }]);
            const price = await (0, energyProviderService_1.getLatestPrice)(mockQuery);
            assert_1.default.strictEqual(price, 0.04);
            sandbox.assert.calledWith(mockQuery, 'SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
        });
        it('should return the latest price from the database (rows result)', async () => {
            console.log('Running test: should return the latest price (rows result)');
            mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves({ rows: [{ price: 0.04 }] });
            const price = await (0, energyProviderService_1.getLatestPrice)(mockQuery);
            assert_1.default.strictEqual(price, 0.04);
            sandbox.assert.calledWith(mockQuery, 'SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
        });
        it('should return default price if no data is available', async () => {
            console.log('Running test: should return default price if no data');
            mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves([]);
            const price = await (0, energyProviderService_1.getLatestPrice)(mockQuery);
            assert_1.default.strictEqual(price, 0.05);
        });
        it('should throw an error if the query fails', async () => {
            console.log('Running test: should throw an error if the query fails');
            mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').rejects(new Error('Database error'));
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.getLatestPrice)(mockQuery), { message: 'Failed to fetch price data' });
        });
    });
    describe('checkAndExecuteTrade', () => {
        let job;
        beforeEach(() => {
            console.log('Setting up checkAndExecuteTrade beforeEach');
            job = { id: '1', data: {} };
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 70 } }),
            });
        });
        it('should execute a buy transaction if conditions are met', async () => {
            console.log('Running test: should execute a buy transaction');
            const mockGetLatestPrice = sandbox.stub().resolves(0.04);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 40 } }),
            });
            mockQuery.withArgs('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 9.5, 0.04, 0]).resolves([{ type: 'buy', quantity: 9.5, price: 0.04, profit: 0 }]);
            await (0, energyProviderService_1.checkAndExecuteTrade)(job, mockQuery, mockGetLatestPrice);
            sandbox.assert.calledWith(mockQuery, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 9.5, 0.04, 0]);
            sandbox.assert.calledWith(loggerInfoStub, 'Transaction buy exécutée: 9.5 kWh à 0.04 €/kWh, profit: 0');
        });
        it('should execute a sell transaction if conditions are met', async () => {
            console.log('Running test: should execute a sell transaction');
            const mockGetLatestPrice = sandbox.stub().resolves(0.13);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 70 } }),
            });
            const profit = 9.5 * (0.13 - 0.05);
            mockQuery.withArgs('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 9.5, 0.13, profit]).resolves([{ type: 'sell', quantity: 9.5, price: 0.13, profit }]);
            await (0, energyProviderService_1.checkAndExecuteTrade)(job, mockQuery, mockGetLatestPrice);
            sandbox.assert.calledWith(mockQuery, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 9.5, 0.13, profit]);
            sandbox.assert.calledWith(loggerInfoStub, `Transaction sell exécutée: 9.5 kWh à 0.13 €/kWh, profit: ${profit}`);
        });
        it('should not execute a transaction if conditions are not met', async () => {
            console.log('Running test: should not execute a transaction if conditions are not met');
            const mockGetLatestPrice = sandbox.stub().resolves(0.06);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 50 } }),
            });
            await (0, energyProviderService_1.checkAndExecuteTrade)(job, mockQuery, mockGetLatestPrice);
            sandbox.assert.notCalled(mockQuery.withArgs('INSERT INTO Transactions'));
        });
        it('should throw an error if fetch fails', async () => {
            console.log('Running test: should throw an error if fetch fails');
            mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves([{ price: 0.04 }]);
            fetchStub.resolves({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.checkAndExecuteTrade)(job, mockQuery), (err) => err.message === 'Failed to fetch SOC: Internal Server Error');
        });
    });
    describe('executeManualTrade', () => {
        it('should execute a buy transaction if conditions are met', async () => {
            console.log('Running test: should execute a buy transaction');
            const mockGetLatestPrice = sandbox.stub().resolves(0.04);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 30 } }),
            });
            mockQuery.withArgs('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 5, 0.04, 0]).resolves([{ type: 'buy', quantity: 5, price: 0.04, profit: 0 }]);
            const result = await (0, energyProviderService_1.executeManualTrade)('buy', 5, mockQuery, mockGetLatestPrice);
            assert_1.default.strictEqual(result.quantity, 5);
            assert_1.default.strictEqual(result.price, 0.04);
            sandbox.assert.calledWith(mockQuery, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 5, 0.04, 0]);
            sandbox.assert.calledWith(loggerInfoStub, 'Transaction manuelle buy: 5 kWh à 0.04 €/kWh, profit: 0');
        });
        it('should execute a sell transaction if conditions are met', async () => {
            console.log('Running test: should execute a sell transaction');
            const mockGetLatestPrice = sandbox.stub().resolves(0.13);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 70 } }),
            });
            const profit = 5 * (0.13 - 0.05);
            mockQuery.withArgs('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 5, 0.13, profit]).resolves([{ type: 'sell', quantity: 5, price: 0.13, profit }]);
            const result = await (0, energyProviderService_1.executeManualTrade)('sell', 5, mockQuery, mockGetLatestPrice);
            assert_1.default.strictEqual(result.quantity, 5);
            assert_1.default.strictEqual(result.price, 0.13);
            sandbox.assert.calledWith(mockQuery, 'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 5, 0.13, profit]);
            sandbox.assert.calledWith(loggerInfoStub, `Transaction manuelle sell: 5 kWh à 0.13 €/kWh, profit: ${profit}`);
        });
        it('should throw an error if buy conditions are not met', async () => {
            console.log('Running test: should throw an error if buy conditions are not met');
            const mockGetLatestPrice = sandbox.stub().resolves(0.06);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 80 } }),
            });
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.executeManualTrade)('buy', 5, mockQuery, mockGetLatestPrice), { message: 'Conditions d\'achat non remplies' });
        });
        it('should throw an error if sell conditions are not met', async () => {
            console.log('Running test: should throw an error if sell conditions are not met');
            const mockGetLatestPrice = sandbox.stub().resolves(0.11);
            fetchStub.resolves({
                ok: true,
                json: async () => ({ metrics: { soc_final: 50 } }),
            });
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.executeManualTrade)('sell', 5, mockQuery, mockGetLatestPrice), { message: 'Conditions de vente non remplies' });
        });
        it('should throw an error if fetch fails', async () => {
            console.log('Running test: should throw an error if fetch fails');
            mockQuery.withArgs('SELECT price FROM Prices ORDER BY time DESC LIMIT 1').resolves([{ price: 0.04 }]);
            fetchStub.resolves({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'Server error',
            });
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.executeManualTrade)('buy', 5, mockQuery), (err) => err.message === 'Failed to fetch SOC: Internal Server Error');
        });
    });
    describe('getTransactions', () => {
        it('should return a list of transactions (array result)', async () => {
            console.log('Running test: should return a list of transactions (array result)');
            mockQuery.withArgs('SELECT * FROM Transactions ORDER BY created_at DESC').resolves([{ id: 1, type: 'buy', quantity: 5, price: 0.04 }]);
            const transactions = await (0, energyProviderService_1.getTransactions)(mockQuery);
            assert_1.default.strictEqual(transactions.length, 1);
            assert_1.default.strictEqual(transactions[0].quantity, 5);
            sandbox.assert.calledWith(mockQuery, 'SELECT * FROM Transactions ORDER BY created_at DESC');
        });
        it('should return a list of transactions (rows result)', async () => {
            console.log('Running test: should return a list of transactions (rows result)');
            mockQuery.withArgs('SELECT * FROM Transactions ORDER BY created_at DESC').resolves({ rows: [{ id: 1, type: 'buy', quantity: 5, price: 0.04 }] });
            const transactions = await (0, energyProviderService_1.getTransactions)(mockQuery);
            assert_1.default.strictEqual(transactions.length, 1);
            assert_1.default.strictEqual(transactions[0].quantity, 5);
            sandbox.assert.calledWith(mockQuery, 'SELECT * FROM Transactions ORDER BY created_at DESC');
        });
        it('should throw an error if the query fails', async () => {
            console.log('Running test: should throw an error if the query fails');
            mockQuery.withArgs('SELECT * FROM Transactions ORDER BY created_at DESC').rejects(new Error('Query failed'));
            await assert_1.default.rejects(async () => await (0, energyProviderService_1.getTransactions)(mockQuery), { message: 'Query failed' });
        });
    });
});
