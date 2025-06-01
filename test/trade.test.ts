import request from 'supertest';
import { app } from '../src/index';
import assert from 'assert';
import nock from 'nock';
import sinon from 'sinon';
import * as energyProviderService from '../src/services/energyProviderService';
import fetch, { Response } from 'node-fetch'; // Import Response from node-fetch

describe('Energy API - Trade', () => {
  let getLatestPriceStub: sinon.SinonStub;
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    // Simuler la réponse de /api/evaluate pour plusieurs appels
    nock('http://localhost:5000')
      .persist()
      .get('/api/evaluate')
      .reply(200, { metrics: { soc_final: 40 } });

    // Simuler fetch pour éviter les appels réseau réels
    fetchStub = sinon.stub(fetch, 'default').resolves(
      new Response(JSON.stringify({ metrics: { soc_final: 40 } }), {
        status: 200,
        statusText: 'OK',
      })
    );

    // Simuler getLatestPrice avec sinon
    getLatestPriceStub = sinon.stub(energyProviderService, 'getLatestPrice').resolves(0.04);
  });

  afterEach(() => {
    // Restaurer les stubs et nettoyer nock
    getLatestPriceStub.restore();
    fetchStub.restore();
    nock.cleanAll();
  });

  it('should execute a manual trade successfully', async () => {
    const response = await request(app)
      .post('/api/energy/trade')
      .send({ type: 'buy', quantity: 5 })
      .set('Accept', 'application/json');

    console.log('Response body:', response.body);
    console.log('Response status:', response.status);

    assert.strictEqual(response.status, 200, 'Le statut HTTP devrait être 200');
    assert.deepStrictEqual(
      response.body,
      { type: 'buy', quantity: 5, price: 0.04, profit: 0 },
      'La réponse devrait contenir les détails de la transaction'
    );
  });
});