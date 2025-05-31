// tests/energyProviderService.test.ts
import { updateEnergyPrice, getLatestPrice } from '../src/services/energyProviderService';


//add ts
jest.mock('../src/config/postgres', () => ({
  query: jest.fn(),
}));

describe('energyProviderService', () => {
  it('should update energy price successfully', async () => {
    const mockQuery = require('../src/config/postgres').query;
    mockQuery.mockResolvedValueOnce([{ price: 0.07 }]);

    const price = await updateEnergyPrice();
    expect(price).toBe(0.07);
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *',
      expect.any(Array)
    );
  });
});