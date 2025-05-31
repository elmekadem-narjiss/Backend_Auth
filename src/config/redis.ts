import { Queue, Worker } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

export const energyPriceQueue = new Queue('energy-prices', { connection });
export const energyTradeQueue = new Queue('energy-trades', { connection });

export default connection;