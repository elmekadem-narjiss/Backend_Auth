"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// test/queues/energyQueue.test.ts
const energyQueue_1 = require("../../src/queues/energyQueue");
require("mocha");
const assert_1 = __importDefault(require("assert"));
describe('Energy Queue - simulatePrice', () => {
    it('should return a price between 0.03 and 0.05 for hours 0-5', () => {
        const price = (0, energyQueue_1.simulatePrice)(3);
        (0, assert_1.default)(price >= 0.03 && price <= 0.05, `Price ${price} should be between 0.03 and 0.05`);
    });
    it('should return a price between 0.06 and 0.09 for hours 6-16', () => {
        const price = (0, energyQueue_1.simulatePrice)(10);
        (0, assert_1.default)(price >= 0.06 && price <= 0.09, `Price ${price} should be between 0.06 and 0.09`);
    });
    it('should return a price between 0.10 and 0.15 for hours 17-23', () => {
        const price = (0, energyQueue_1.simulatePrice)(18);
        (0, assert_1.default)(price >= 0.10 && price <= 0.15, `Price ${price} should be between 0.10 and 0.15`);
    });
});
