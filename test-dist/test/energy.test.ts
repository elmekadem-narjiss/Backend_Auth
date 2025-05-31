import request from 'supertest';
import { app } from '../src/index'; // Ajustez le chemin selon votre structure

describe('Energy API', () => {
  // Test pour la route GET /api/energy/prices
  it('should return 200 and a list of energy prices', async () => {
    const response = await request(app)
      .get('/api/energy/prices')
      .set('Accept', 'application/json');

    // Vérifications
    expect(response.status).toBe(200); // Vérifie que le statut HTTP est 200
    expect(response.body).toBeInstanceOf(Array); // Vérifie que la réponse est un tableau
    expect(response.body.length).toBeGreaterThan(0); // Vérifie qu'il y a au moins un élément
    expect(response.body[0]).toHaveProperty('price'); // Vérifie que chaque élément a une propriété 'price'
    expect(response.body[0].price).toBeGreaterThanOrEqual(0); // Vérifie que le prix est positif ou zéro
  });

  // Test pour une route inexistante
  it('should return 404 for an invalid route', async () => {
    const response = await request(app).get('/api/invalid-route');

    expect(response.status).toBe(404); // Vérifie que le statut HTTP est 404
  });
});