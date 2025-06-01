import logger from '../config/logger';
import fetch from 'node-fetch';
import { Job } from 'bullmq';

type QueryResult<T> = T[] | { rows: T[] };
type QueryFunction = (text: string, params?: any[]) => Promise<QueryResult<any>>;

export function simulatePrice(hour: number): number {
  console.log(`simulatePrice called with hour: ${hour}`);
  if (hour >= 0 && hour <= 5) return Number((Math.random() * (0.05 - 0.03) + 0.03).toFixed(2));
  if (hour >= 6 && hour <= 16) return Number((Math.random() * (0.09 - 0.06) + 0.06).toFixed(2));
  return Number((Math.random() * (0.15 - 0.10) + 0.10).toFixed(2));
}

export async function updateEnergyPrice(query: QueryFunction): Promise<number> {
  console.log('updateEnergyPrice called');
  const now = new Date();
  const hour = now.getHours();
  const price = simulatePrice(hour);
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

  if (type === 'buy' && price <= 0.05 && soc <= 50) {
    const result = await query('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', [type, quantity, price, 0]);
    logger.info(`Transaction manuelle buy: ${quantity} kWh à ${price} €/kWh, profit: 0`);
    return { type, quantity, price, profit: 0 };
  } else if (type === 'sell' && price >= 0.10 && soc >= 60) {
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