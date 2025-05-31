import request from 'supertest';
import { app } from '../src/index'; // Ajustez le chemin si nécessaire
import assert from 'assert'; // Importez le module assert de Node.js

describe('Energy API - Prices', () => {
  it('should return 200 and a list of energy prices', async () => {
    const response = await request(app)
      .get('/api/energy/prices')
      .set('Accept', 'application/json');

    // Ajoutez un log pour inspecter la réponse
    console.log('Response body:', response.body);
    console.log('Response status:', response.status);

    // Assertions
    assert.strictEqual(response.status, 200, 'Le statut HTTP devrait être 200');
    assert(Array.isArray(response.body), 'La réponse devrait être un tableau');
    assert(response.body.length > 0, 'Le tableau devrait contenir au moins un élément');
    assert('price' in response.body[0], "Le premier élément devrait avoir une propriété 'price'");
    assert(response.body[0].price >= 0, 'Le prix devrait être supérieur ou égal à 0');
  });
});