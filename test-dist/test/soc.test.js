"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
const assert_1 = __importDefault(require("assert"));
const nock_1 = __importDefault(require("nock"));
describe('Energy API - SOC', () => {
    beforeEach(() => {
        // Simuler la réponse de /api/evaluate
        (0, nock_1.default)('http://localhost:5000')
            .get('/api/evaluate')
            .reply(200, { metrics: { soc_final: 75 } });
    });
    afterEach(() => {
        nock_1.default.cleanAll(); // Nettoyer les mocks après chaque test
    });
    it('should return the current SOC', async () => {
        const response = await (0, supertest_1.default)(index_1.app)
            .get('/api/energy/soc')
            .set('Accept', 'application/json');
        console.log('Response body:', response.body);
        console.log('Response status:', response.status);
        assert_1.default.strictEqual(response.status, 200, 'Le statut HTTP devrait être 200');
        (0, assert_1.default)('soc' in response.body, "La réponse devrait avoir une propriété 'soc'");
    });
});
