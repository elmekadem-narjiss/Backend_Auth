"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index"); // Ajustez le chemin si nécessaire
const assert_1 = __importDefault(require("assert")); // Importez le module assert de Node.js
describe('Energy API - Prices', () => {
    it('should return 200 and a list of energy prices', async () => {
        const response = await (0, supertest_1.default)(index_1.app)
            .get('/api/energy/prices')
            .set('Accept', 'application/json');
        // Ajoutez un log pour inspecter la réponse
        console.log('Response body:', response.body);
        console.log('Response status:', response.status);
        // Assertions
        assert_1.default.strictEqual(response.status, 200, 'Le statut HTTP devrait être 200');
        (0, assert_1.default)(Array.isArray(response.body), 'La réponse devrait être un tableau');
        (0, assert_1.default)(response.body.length > 0, 'Le tableau devrait contenir au moins un élément');
        (0, assert_1.default)('price' in response.body[0], "Le premier élément devrait avoir une propriété 'price'");
        (0, assert_1.default)(response.body[0].price >= 0, 'Le prix devrait être supérieur ou égal à 0');
    });
});
