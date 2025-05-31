import request from 'supertest';
import { app } from '../src/index';
import assert from 'assert';
import nock from 'nock';

describe('Energy API - SOC', () => {
  beforeEach(() => {
    // Simuler la réponse de /api/evaluate
    nock('http://localhost:5000')
      .get('/api/evaluate')
      .reply(200, { metrics: { soc_final: 75 } });
  });

  afterEach(() => {
    nock.cleanAll(); // Nettoyer les mocks après chaque test
  });

  it('should return the current SOC', async () => {
    const response = await request(app)
      .get('/api/energy/soc')
      .set('Accept', 'application/json');

    console.log('Response body:', response.body);
    console.log('Response status:', response.status);

    assert.strictEqual(response.status, 200, 'Le statut HTTP devrait être 200');
    assert('soc' in response.body, "La réponse devrait avoir une propriété 'soc'");
  });
});