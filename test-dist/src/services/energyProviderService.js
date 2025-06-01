"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.executeManualTrade = exports.checkAndExecuteTrade = exports.getLatestPrice = exports.updateEnergyPrice = exports.simulatePrice = void 0;
const postgres_1 = require("../config/postgres");
const logger_1 = __importDefault(require("../config/logger"));
// Fonction pour simuler les prix de l'énergie
const simulatePrice = (currentHour) => {
    if (currentHour >= 0 && currentHour < 6) {
        return Math.random() * (0.05 - 0.03) + 0.03;
    }
    else if (currentHour >= 6 && currentHour < 17) {
        return Math.random() * (0.09 - 0.06) + 0.06;
    }
    else {
        return Math.random() * (0.15 - 0.10) + 0.10;
    }
};
exports.simulatePrice = simulatePrice;
// Enregistrer un prix simulé dans PostgreSQL
const updateEnergyPrice = async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const price = (0, exports.simulatePrice)(currentHour);
    await (0, postgres_1.query)('INSERT INTO Prices (time, price) VALUES ($1, $2) RETURNING *', [now, price]);
    logger_1.default.info(`Prix simulé à ${now.toISOString()}: ${price} €/kWh`);
    return price;
};
exports.updateEnergyPrice = updateEnergyPrice;
// Récupérer le dernier prix
const getLatestPrice = async () => {
    const result = await (0, postgres_1.query)('SELECT price FROM Prices ORDER BY time DESC LIMIT 1');
    if (Array.isArray(result) && result.length > 0) {
        return result[0].price;
    }
    else if ('rows' in result && result.rows.length > 0) {
        return result.rows[0].price;
    }
    return 0.05; // Valeur par défaut si aucun résultat
};
exports.getLatestPrice = getLatestPrice;
// Vérifier et exécuter une transaction automatique
const checkAndExecuteTrade = async (job) => {
    const latestPrice = await (0, exports.getLatestPrice)();
    const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch SOC: ${response.status} ${response.statusText}`);
    }
    const { metrics } = await response.json();
    const soc = metrics.soc_final || 50;
    let transactionType = null;
    let quantity = 0;
    let profit = 0;
    if (latestPrice < 0.05 && soc < 40) {
        transactionType = 'buy';
        quantity = Math.min(10, (40 - soc) * 0.95);
        profit = 0;
    }
    else if (latestPrice > 0.12 && soc > 60) {
        transactionType = 'sell';
        quantity = Math.min(5, (soc - 60) * 0.95);
        profit = quantity * (latestPrice - 0.05);
    }
    if (transactionType) {
        await (0, postgres_1.query)('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', [transactionType, quantity, latestPrice, profit]);
        logger_1.default.info(`Transaction ${transactionType} exécutée: ${quantity} kWh à ${latestPrice} €/kWh, profit: ${profit}`);
    }
};
exports.checkAndExecuteTrade = checkAndExecuteTrade;
// Exécuter une transaction manuelle
const executeManualTrade = async (type, quantity) => {
    const latestPrice = await (0, exports.getLatestPrice)();
    const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        const errorText = await response.text();
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
    const result = await (0, postgres_1.query)('INSERT INTO Transactions (type, quantity, price, profit) VALUES ($1, $2, $3, $4) RETURNING *', [type, quantity, latestPrice, profit]);
    logger_1.default.info(`Transaction manuelle ${type}: ${quantity} kWh à ${latestPrice} €/kWh, profit: ${profit}`);
    return result[0];
};
exports.executeManualTrade = executeManualTrade;
// Récupérer l'historique des transactions
const getTransactions = async () => {
    const result = await (0, postgres_1.query)('SELECT * FROM Transactions ORDER BY created_at DESC');
    return Array.isArray(result) ? result : result.rows;
};
exports.getTransactions = getTransactions;
