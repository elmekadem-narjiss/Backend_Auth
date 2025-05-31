"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.energyTradeQueue = exports.energyPriceQueue = void 0;
const bullmq_1 = require("bullmq");
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};
exports.energyPriceQueue = new bullmq_1.Queue('energy-prices', { connection });
exports.energyTradeQueue = new bullmq_1.Queue('energy-trades', { connection });
exports.default = connection;
