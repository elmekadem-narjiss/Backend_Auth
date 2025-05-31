import request from 'supertest';
import { app } from '../src/index';
import assert from 'assert';
import nock from 'nock';
import sinon from 'sinon';
import * as energyProviderService from '../src/services/energyProviderService';

describe('Energy API - Trade', () => {
  let getLatestPriceStub: sinon.SinonStub;

  beforeEach(() => {
    // Simuler la réponse de /api/evaluate pour plusieurs appels
    nock('http://localhost:5000')
      .persist() // Permet de réutiliser cette simulation pour plusieurs appels
      .get('/api/evaluate')
      .reply(200, { metrics: { soc_final: 75 } });

    // Simuler getLatestPrice avec sinon
    getLatestPriceStub = sinon.stub(energyProviderService, 'getLatestPrice').resolves(0.04);
  });

  afterEach(() => {
    // Restaurer les stubs et nettoyer nock
    getLatestPriceStub.restore();
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
  });
});