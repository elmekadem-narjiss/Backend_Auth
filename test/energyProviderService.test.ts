import { app } from '../src/index';
import request from 'supertest';
import assert from 'assert';
import 'mocha';

describe('Backend API', () => {
  it('should return 200 on root endpoint', (done: Mocha.Done) => {
    request(app)
      .get('/')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        assert.strictEqual(res.text, 'API de gestion BESS et panneaux solaires');
        done();
      });
  });

  it('should handle /api/tasks route', (done: Mocha.Done) => {
    request(app)
      .get('/api/tasks')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        // Ajoute d'autres assertions si nécessaire, par exemple :
        assert(Array.isArray(res.body), 'Response should be an array');
        done();
      });
  });
});