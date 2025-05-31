"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const energyProviderService_1 = require("../services/energyProviderService");
const logger_1 = __importDefault(require("../config/logger"));
// Planifier la mise à jour des prix toutes les 15 minutes
redis_1.energyPriceQueue.add('update-price', {}, {
    repeat: { every: 15 * 60 * 1000 }, // 15 minutes (900 000 ms)
});
// Planifier la vérification des transactions toutes les 15 minutes
redis_1.energyTradeQueue.add('check-trade', {}, {
    repeat: { every: 15 * 60 * 1000 }, // 15 minutes (900 000 ms)
});
// Worker pour traiter les mises à jour des prix
new bullmq_1.Worker('energy-prices', async (job) => {
    logger_1.default.info(`Worker energy-prices processing job: ${job.name} at ${new Date().toISOString()}`);
    if (job.name === 'update-price') {
        try {
            const price = await (0, energyProviderService_1.updateEnergyPrice)();
            logger_1.default.info(`Prix mis à jour avec succès: ${price} €/kWh at ${new Date().toISOString()}`);
        }
        catch (error) {
            // Typage explicite et gestion sécurisée
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger_1.default.error(`Erreur lors de la mise à jour du prix: ${errorMessage}`);
        }
    }
}, { connection: redis_1.energyPriceQueue.opts.connection });
// Worker pour traiter les transactions automatiques
new bullmq_1.Worker('energy-trades', async (job) => {
    logger_1.default.info(`Worker energy-trades processing job: ${job.name} at ${new Date().toISOString()}`);
    if (job.name === 'check-trade') {
        try {
            await (0, energyProviderService_1.checkAndExecuteTrade)(job);
            logger_1.default.info(`Vérification des transactions terminée at ${new Date().toISOString()}`);
        }
        catch (error) {
            // Typage explicite et gestion sécurisée
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger_1.default.error(`Erreur lors de la vérification des transactions: ${errorMessage}`);
        }
    }
}, { connection: redis_1.energyTradeQueue.opts.connection });
// Démarrer immédiatement une mise à jour pour aligner avec l'heure actuelle
const initializePriceUpdate = async () => {
    logger_1.default.info(`Initialisation immédiate des prix à ${new Date().toISOString()}`);
    try {
        const price = await (0, energyProviderService_1.updateEnergyPrice)();
        logger_1.default.info(`Prix initialisé avec succès: ${price} €/kWh`);
    }
    catch (error) {
        // Typage explicite et gestion sécurisée
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger_1.default.error(`Erreur lors de l'initialisation: ${errorMessage}`);
    }
};
initializePriceUpdate().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger_1.default.error(`Erreur lors de l'initialisation: ${errorMessage}`);
});
