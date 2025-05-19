import request from 'supertest';
import { app } from '../src/index';
import { Sequelize } from 'sequelize';
import assert from 'assert';
import 'mocha';

describe('Integration Tests', () => {
  let sequelize: Sequelize;

  before(async () => {
    sequelize = new Sequelize({
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
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', description: 'Test Description' })
      .expect(201);

    // Récupérer la tâche
    const response = await request(app)
      .get('/api/tasks')
      .expect(200);

    assert(response.body.length > 0, 'Tasks list should not be empty');
    assert(response.body.some((task: any) => task.title === 'Test Task'));
  });
});