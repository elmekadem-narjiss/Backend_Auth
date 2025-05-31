import { Worker } from 'bullmq';
import { energyPriceQueue, energyTradeQueue } from '../config/redis';
import { updateEnergyPrice, checkAndExecuteTrade } from '../services/energyProviderService';
import logger from '../config/logger';

// Planifier la mise à jour des prix toutes les 15 minutes
energyPriceQueue.add('update-price', {}, {
  repeat: { every: 15 * 60 * 1000 }, // 15 minutes (900 000 ms)
});

// Planifier la vérification des transactions toutes les 15 minutes
energyTradeQueue.add('check-trade', {}, {
  repeat: { every: 15 * 60 * 1000 }, // 15 minutes (900 000 ms)
});

// Worker pour traiter les mises à jour des prix
new Worker(
  'energy-prices',
  async (job) => {
    logger.info(`Worker energy-prices processing job: ${job.name} at ${new Date().toISOString()}`);
    if (job.name === 'update-price') {
      try {
        const price = await updateEnergyPrice();
        logger.info(`Prix mis à jour avec succès: ${price} €/kWh at ${new Date().toISOString()}`);
      } catch (error: unknown) {
        // Typage explicite et gestion sécurisée
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error(`Erreur lors de la mise à jour du prix: ${errorMessage}`);
      }
    }
  },
  { connection: energyPriceQueue.opts.connection }
);

// Worker pour traiter les transactions automatiques
new Worker(
  'energy-trades',
  async (job) => {
    logger.info(`Worker energy-trades processing job: ${job.name} at ${new Date().toISOString()}`);
    if (job.name === 'check-trade') {
      try {
        await checkAndExecuteTrade(job);
        logger.info(`Vérification des transactions terminée at ${new Date().toISOString()}`);
      } catch (error: unknown) {
        // Typage explicite et gestion sécurisée
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error(`Erreur lors de la vérification des transactions: ${errorMessage}`);
      }
    }
  },
  { connection: energyTradeQueue.opts.connection }
);

// Démarrer immédiatement une mise à jour pour aligner avec l'heure actuelle
const initializePriceUpdate = async () => {
  logger.info(`Initialisation immédiate des prix à ${new Date().toISOString()}`);
  try {
    const price = await updateEnergyPrice();
    logger.info(`Prix initialisé avec succès: ${price} €/kWh`);
  } catch (error: unknown) {
    // Typage explicite et gestion sécurisée
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error(`Erreur lors de l'initialisation: ${errorMessage}`);
  }
};

initializePriceUpdate().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  logger.error(`Erreur lors de l'initialisation: ${errorMessage}`);
});