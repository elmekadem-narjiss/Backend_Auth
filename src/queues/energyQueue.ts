import { Worker, Queue, Job } from 'bullmq';
import crypto from 'crypto';

// Définir une file d'attente pour les mises à jour des prix
const energyPriceQueue = new Queue('energy-price-updates', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Fonction pour simuler les prix de l'énergie de manière sécurisée
export const simulatePrice = (currentHour: number): number => {
  // Utiliser crypto.getRandomValues pour générer un nombre aléatoire sécurisé
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const randomValue = array[0] / (0xFFFFFFFF + 1); // Normaliser entre 0 et 1

  if (currentHour >= 0 && currentHour < 6) {
    return randomValue * (0.05 - 0.03) + 0.03;
  } else if (currentHour >= 6 && currentHour < 17) {
    return randomValue * (0.09 - 0.06) + 0.06;
  } else {
    return randomValue * (0.15 - 0.10) + 0.10;
  }
};

// Worker pour traiter les mises à jour des prix
const priceUpdateWorker = new Worker('energy-price-updates', async (job: Job) => {
  const { currentHour } = job.data;
  const price = simulatePrice(currentHour);
  console.log(`Price updated for hour ${currentHour}: ${price}`);
  return price;
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Gestion des événements du Worker
priceUpdateWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed with result: ${job.returnvalue}`);
});

priceUpdateWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

// Ajouter un job à la file d'attente (exemple d'utilisation)
const addPriceUpdateJob = async (currentHour: number) => {
  await energyPriceQueue.add('update-price', { currentHour });
};

// Exécuter un exemple de job lors du démarrage (facultatif, peut être supprimé si non nécessaire)
if (process.env.NODE_ENV !== 'test') {
  const currentHour = new Date().getHours();
  addPriceUpdateJob(currentHour)
    .then(() => console.log('Price update job added'))
    .catch((err) => console.error('Error adding price update job:', err));
}

export { energyPriceQueue, priceUpdateWorker, addPriceUpdateJob };