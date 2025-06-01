"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
const assert_1 = __importDefault(require("assert"));
const nock_1 = __importDefault(require("nock"));
const sinon_1 = __importDefault(require("sinon"));
const energyProviderService = __importStar(require("../src/services/energyProviderService"));
const node_fetch_1 = __importStar(require("node-fetch")); // Import Response from node-fetch
describe('Energy API - Trade', () => {
    let getLatestPriceStub;
    let fetchStub;
    beforeEach(() => {
        // Simuler la réponse de /api/evaluate pour plusieurs appels
        (0, nock_1.default)('http://localhost:5000')
            .persist()
            .get('/api/evaluate')
            .reply(200, { metrics: { soc_final: 40 } });
        // Simuler fetch pour éviter les appels réseau réels
        fetchStub = sinon_1.default.stub(node_fetch_1.default, 'default').resolves(new node_fetch_1.Response(JSON.stringify({ metrics: { soc_final: 40 } }), {
            status: 200,
            statusText: 'OK',
        }));
        // Simuler getLatestPrice avec sinon
        getLatestPriceStub = sinon_1.default.stub(energyProviderService, 'getLatestPrice').resolves(0.04);
    });
    afterEach(() => {
        // Restaurer les stubs et nettoyer nock
        getLatestPriceStub.restore();
        fetchStub.restore();
        nock_1.default.cleanAll();
    });
    it('should execute a manual trade successfully', async () => {
        const response = await (0, supertest_1.default)(index_1.app)
            .post('/api/energy/trade')
            .send({ type: 'buy', quantity: 5 })
            .set('Accept', 'application/json');
        console.log('Response body:', response.body);
        console.log('Response status:', response.status);
        assert_1.default.strictEqual(response.status, 200, 'Le statut HTTP devrait être 200');
        assert_1.default.deepStrictEqual(response.body, { type: 'buy', quantity: 5, price: 0.04, profit: 0 }, 'La réponse devrait contenir les détails de la transaction');
    });
});
