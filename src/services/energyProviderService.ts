import { query } from '../config/postgres';
import logger from '../config/logger';
import { Job } from 'bullmq';

// Fonction pour simuler les prix de l'énergie
const simulatePrice = (currentHour: number): number => {
  if (currentHour >= 0 && currentHour < 6) {
    return Math.random() * (0.05 - 0.03) + 0.03;
  } else if (currentHour >= 6 && currentHour < 17) {
    return Math.random() * (0.09 - 0.06) + 0.06;
  } else {
    return Math.random() * (0.15 - 0.10) + 0.10;
  }
};

// Enregistrer un prix simulé dans PostgreSQL
export const updateEnergyPrice = async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const price = simulatePrice(currentHour);
  await query('INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]);
  logger.info(`Prix simulé à ${now.toISOString()}: ${price} €/kWh`);
  return price;
};

// Récupérer le dernier prix
export const getLatestPrice = async (): Promise<number> => {
  const result = await query('SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
  return result.length > 0 ? result[0].price : 0.05;
};

// Vérifier et exécuter une transaction automatique
export const checkAndExecuteTrade = async (job: Job) => {
  const latestPrice = await getLatestPrice();
  const response = await fetch('http://localhost:5000/api/evaluate', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch SOC: ${response.status} ${response.statusText}`);
  }
  const { metrics } = await response.json();
  const soc = metrics.soc_final || 50;

  let transactionType: string | null = null;
  let quantity = 0;
  let profit = 0;

  if (latestPrice < 0.05 && soc < 40) {
    transactionType = 'buy';
    quantity = Math.min(10, (40 - soc) * 0.95);
    profit = 0;
  } else if (latestPrice > 0.12 && soc > 60) {
    transactionType = 'sell';
    quantity = Math.min(5, (soc - 60) * 0.95);
    profit = quantity * (latestPrice - 0.05);
  }

  if (transactionType) {
    await query(
      'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *',
      [transactionType, quantity, latestPrice, profit]
    );
    logger.info(`Transaction ${transactionType} exécutée: ${quantity} kWh à ${latestPrice} €/kWh, profit: ${profit}`);
  }
};

// Exécuter une transaction manuelle
export const executeManualTrade = async (type: 'buy' | 'sell', quantity: number) => {
  const latestPrice = await getLatestPrice();
  const response = await fetch('http://localhost:5000/api/evaluate', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorText = await response.text(); // Récupérer le texte brut pour débogage
    throw new Error(`Failed to fetch SOC: ${response.status} ${response.statusText} - Response: ${errorText}`);
  }
  const { metrics } = await response.json();
  const soc = metrics.soc_final || 50;

  if (type === 'buy' && (latestPrice >= 0.05 || soc >= 80 || quantity > 10)) {
    throw new Error('Conditions d\'achat non remplies');
  }
  if (type === 'sell' && (latestPrice <= 0.12 || soc <= 60 || quantity > 5)) {
    throw new Error('Conditions de vente non remplies');
  }

  const profit = type === 'sell' ? quantity * (latestPrice - 0.05) : 0;
  const result = await query(
    'INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *',
    [type, quantity, latestPrice, profit]
  );
  logger.info(`Transaction manuelle ${type}: ${quantity} kWh à ${latestPrice} €/kWh, profit: ${profit}`);
  return result[0];
};

// Récupérer l'historique des transactions
export const getTransactions = async () => {
  return await query('SELECT * FROM Transactions ORDER BY created_at DESC');
};