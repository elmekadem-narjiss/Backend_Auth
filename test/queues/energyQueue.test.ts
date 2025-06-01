// test/queues/energyQueue.test.ts
import { simulatePrice } from '../../src/queues/energyQueue';
import 'mocha';
import assert from 'assert';

describe('Energy Queue - simulatePrice', () => {
  it('should return a price between 0.03 and 0.05 for hours 0-5', () => {
    const price = simulatePrice(3);
    assert(price >= 0.03 && price <= 0.05, `Price ${price} should be between 0.03 and 0.05`);
  });

  it('should return a price between 0.06 and 0.09 for hours 6-16', () => {
    const price = simulatePrice(10);
    assert(price >= 0.06 && price <= 0.09, `Price ${price} should be between 0.06 and 0.09`);
  });

  it('should return a price between 0.10 and 0.15 for hours 17-23', () => {
    const price = simulatePrice(18);
    assert(price >= 0.10 && price <= 0.15, `Price ${price} should be between 0.10 and 0.15`);
  });
});