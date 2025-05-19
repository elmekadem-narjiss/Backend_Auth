"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
const sequelize_1 = require("sequelize");
const assert_1 = __importDefault(require("assert"));
require("mocha");
describe('Integration Tests', () => {
    let sequelize;
    before(async () => {
        sequelize = new sequelize_1.Sequelize({
            database: process.env.PG_DBNAME || 'energy_db',
            username: process.env.PG_USER || 'admin',
            password: process.env.PG_PASSWORD || 'admin123',
            host: process.env.PG_HOST || 'localhost',
            port: Number(process.env.PG_PORT) || 5432,
            dialect: 'postgres',
            logging: false
        });
        await sequelize.sync({ force: true }); // Réinitialise la base
    });
    after(() => {
        return sequelize.close();
    });
    it('should create and retrieve a task', async () => {
        // Créer une tâche
        await (0, supertest_1.default)(index_1.app)
            .post('/api/tasks')
            .send({ title: 'Test Task', description: 'Test Description' })
            .expect(201);
        // Récupérer la tâche
        const response = await (0, supertest_1.default)(index_1.app)
            .get('/api/tasks')
            .expect(200);
        (0, assert_1.default)(response.body.length > 0, 'Tasks list should not be empty');
        (0, assert_1.default)(response.body.some((task) => task.title === 'Test Task'));
    });
});
