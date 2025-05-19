"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const supertest_1 = __importDefault(require("supertest"));
const assert_1 = __importDefault(require("assert"));
require("mocha");
describe('Backend API', () => {
    it('should return 200 on root endpoint', (done) => {
        (0, supertest_1.default)(index_1.app)
            .get('/')
            .expect(200)
            .end((err, res) => {
            if (err)
                return done(err);
            assert_1.default.strictEqual(res.text, 'API de gestion BESS et panneaux solaires');
            done();
        });
    });
    it('should handle /api/tasks route', (done) => {
        (0, supertest_1.default)(index_1.app)
            .get('/api/tasks')
            .expect(200)
            .end((err, res) => {
            if (err)
                return done(err);
            // Ajoute d'autres assertions si nécessaire, par exemple :
            // assert(Array.isArray(res.body), 'Response should be an array');
            done();
        });
    });
});
