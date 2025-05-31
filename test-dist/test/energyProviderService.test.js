"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tests/energyProviderService.test.ts
const energyProviderService_1 = require("../src/services/energyProviderService");
jest.mock('../src/config/postgres', () => ({
    query: jest.fn(),
}));
describe('energyProviderService', () => {
    it('should update energy price successfully', async () => {
        const mockQuery = require('../src/config/postgres').query;
        mockQuery.mockResolvedValueOnce([{ price: 0.07 }]);
        const price = await (0, energyProviderService_1.updateEnergyPrice)();
        expect(price).toBe(0.07);
        expect(mockQuery).toHaveBeenCalledWith('INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', expect.any(Array));
    });
});
