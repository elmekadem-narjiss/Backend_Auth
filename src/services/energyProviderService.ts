import logger from '../config/logger';
import fetch from 'node-fetch';
import { Job } from 'bullmq';
import { randomInt } from 'crypto';
import seedrandom from 'seedrandom';

type QueryResult<T> = T[] | { rows: T[] };
type QueryFunction = (text: string, params?: any[]) => Promise<QueryResult<any>>;

function generateRandomPrice(min: number, max: number, useCrypto: boolean = false, seed?: string): number {
  let randomValue: number;
  if (useCrypto) {
    randomValue = randomInt(0, 10000) / 10000; // Génère un nombre entre 0 et 1
  } else if (seed) {
    const rng = seedrandom(seed);
    randomValue = rng();
  } else {
    randomValue = Math.random();
  }
  const range = max - min;
  return Number((randomValue * range + min).toFixed(2));
}

export function simulatePrice(hour: number, useCrypto: boolean = false, seed?: string): number {
  console.log(`simulatePrice called with hour: ${hour}`);
  if (hour >= 0 && hour <= 5) return generateRandomPrice(0.03, 0.05, useCrypto, seed);
  if (hour >= 6 && hour <= 16) return generateRandomPrice(0.06, 0.09, useCrypto, seed);
  return generateRandomPrice(0.10, 0.15, useCrypto, seed);
}

export async function updateEnergyPrice(query: QueryFunction): Promise<number> {
  console.log('updateEnergyPrice called');
  const now = new Date();
  const hour = now.getHours();
  const price = simulatePrice(hour, true); // Utilise crypto.randomInt() pour la sécurité en production
  console.log(`Executing query with: INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *`, [now, price]);
  const result = await query('INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]) as QueryResult<{ time: Date; price: number }>;
  logger.info(`Prix simulé à ${now.toISOString()}: ${price} €/kWh`);
  return price;
}

export const getLatestPrice = async (query: QueryFunction): Promise<number> => {
  try {
    console.log('getLatestPrice called');
    const result = await query('SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
    console.log('Executing query with: SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
    
    if (Array.isArray(result) && result.length > 0) {
      return result[0].price;
    } else if ('rows' in result && Array.isArray(result.rows) && result.rows.length > 0) {
      return result.rows[0].price;
    } else {
      return 0.05;
    }
  } catch (error) {
    throw new Error('Failed to fetch price data');
  }
};

export async function checkAndExecuteTrade(job: Job, query: QueryFunction, getLatestPriceFn: (query: QueryFunction) => Promise<number> = getLatestPrice): Promise<void> {
  console.log('checkAndExecuteTrade called with job:', job);
  const price = await getLatestPriceFn(query);
  const socEndpoint = process.env.SOC_ENDPOINT || 'http://localhost:5000/api/evaluate';
  const response = await fetch(socEndpoint);
  if (!response.ok) {
    throw new Error(`Failed to fetch SOC: ${response.statusText}`);
  }
  const data = await response.json();
  const soc = data.metrics.soc_final;

  if (price <= 0.05 && soc <= 50) {
    const result = await query('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['buy', 9.5, price, 0]);
    logger.info(`Transaction buy exécutée: 9.5 kWh à ${price} €/kWh, profit: 0`);
  } else if (price >= 0.10 && soc >= 60) {
    const profit = 9.5 * (price - 0.05);
    const result = await query('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', ['sell', 9.5, price, profit]);
    logger.info(`Transaction sell exécutée: 9.5 kWh à ${price} €/kWh, profit: ${profit}`);
  }
}

// src/services/energyProviderService.ts
export async function executeManualTrade(type: string, quantity: number, query: QueryFunction, getLatestPriceFn: (query: QueryFunction) => Promise<number> = getLatestPrice): Promise<{ type: string; quantity: number; price: number; profit: number }> {
  console.log('executeManualTrade called with type:', type, 'quantity:', quantity);
  const price = await getLatestPriceFn(query);
  const socEndpoint = process.env.SOC_ENDPOINT || 'http://localhost:5000/api/evaluate';
  const response = await fetch(socEndpoint);
  if (!response.ok) {
    throw new Error(`Failed to fetch SOC: ${response.statusText}`);
  }
  const data = await response.json();
  const soc = data.metrics.soc_final;

  if (type === 'buy' && price <= 0.20 && soc <= 50) {
    const result = await query('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', [type, quantity, price, 0]);
    logger.info(`Transaction manuelle buy: ${quantity} kWh à ${price} €/kWh, profit: 0`);
    return { type, quantity, price, profit: 0 };
  } else if (type === 'sell' && price >= 0.10 && soc >= 50) { // Réduit de 60 à 50
    const profit = quantity * (price - 0.05);
    const result = await query('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', [type, quantity, price, profit]);
    logger.info(`Transaction manuelle sell: ${quantity} kWh à ${price} €/kWh, profit: ${profit}`);
    return { type, quantity, price, profit };
  }
  throw new Error(type === 'buy' ? 'Conditions d\'achat non remplies' : 'Conditions de vente non remplies');
}
export async function getTransactions(query: QueryFunction): Promise<{ id: number; type: string; quantity: number; price: number }[]> {
  console.log('getTransactions called');
  console.log('Executing query with: SELECT * FROM Transactions ORDER BY created_at DESC');
  const result = await query('SELECT * FROM Transactions ORDER BY created_at DESC') as QueryResult<{ id: number; type: string; quantity: number; price: number }>;
  if (Array.isArray(result)) return result;
  if ('rows' in result) return result.rows;
  return [];
}