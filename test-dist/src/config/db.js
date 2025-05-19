"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sequelize = new sequelize_1.Sequelize({
    database: process.env.PG_DBNAME || 'energy_db',
    username: process.env.PG_USER || 'admin',
    password: process.env.PG_PASSWORD || 'admin123',
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
});
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connexion à PostgreSQL établie');
        await sequelize.sync({ alter: true }); // Met à jour les tables en ajoutant/modifiant les colonnes
    }
    catch (error) {
        console.error('Erreur de connexion à PostgreSQL:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
exports.default = sequelize;
