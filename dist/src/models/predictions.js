"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPredictionsRaw = exports.getPredictions = void 0;
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../config/db"));
// Définir le modèle avec mappage explicite des champs
const Prediction = db_1.default.define('predictions_lstm', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, field: 'id' },
    energyproduced: { type: sequelize_1.DataTypes.DOUBLE, field: 'energyproduced' },
    temperature: { type: sequelize_1.DataTypes.DOUBLE, field: 'temperature' },
    humidity: { type: sequelize_1.DataTypes.DOUBLE, field: 'humidity' },
    month: { type: sequelize_1.DataTypes.INTEGER, field: 'month' },
    week_of_year: { type: sequelize_1.DataTypes.INTEGER, field: 'week_of_year' },
    hour: { type: sequelize_1.DataTypes.INTEGER, field: 'hour' },
    prediction_day: { type: sequelize_1.DataTypes.DATE, field: 'prediction_day' }, // Ajusté pour correspondre
}, { timestamps: false, tableName: 'predictions_lstm' }); // Forcer le nom de la table
// Log pour vérifier que le modèle est défini
console.log('Modèle Prediction défini pour la table predictions_lstm');
// Fonction pour récupérer toutes les prédictions
const getPredictions = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Début de la récupération de toutes les prédictions');
        const tableExists = yield db_1.default.getQueryInterface().showAllTables();
        console.log('Tables dans la base de données:', tableExists);
        if (!tableExists.includes('predictions_lstm')) {
            console.warn('La table predictions_lstm n\'existe pas dans la base de données !');
        }
        const predictions = yield Prediction.findAll();
        console.log('Nombre de lignes récupérées:', predictions.length);
        console.log('Données récupérées:', JSON.stringify(predictions, null, 2));
        return predictions;
    }
    catch (error) {
        console.error('Erreur lors de la récupération des prédictions:', error);
        throw new Error('Error fetching predictions');
    }
});
exports.getPredictions = getPredictions;
// Fonction pour tester une requête brute
const getPredictionsRaw = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Exécution d\'une requête SQL brute pour débogage');
        const predictions = yield db_1.default.query(`SELECT * FROM predictions_lstm`, { type: sequelize_1.QueryTypes.SELECT });
        console.log('Données brutes récupérées:', JSON.stringify(predictions, null, 2));
        return predictions;
    }
    catch (error) {
        console.error('Erreur lors de la requête brute:', error);
        throw error;
    }
});
exports.getPredictionsRaw = getPredictionsRaw;
exports.default = Prediction;
