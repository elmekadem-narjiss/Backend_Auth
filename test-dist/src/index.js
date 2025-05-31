"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const batteryRoutes_1 = __importDefault(require("./routes/batteryRoutes"));
const predictions_1 = __importDefault(require("./routes/predictions"));
const equipment_1 = __importDefault(require("./routes/equipment"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const http_1 = require("http");
const websocketService_1 = require("./services/websocketService");
const energyProviderService_1 = require("./services/energyProviderService");
const axios_1 = __importStar(require("axios"));
// Ajout d'un commentaire pour déclencher une nouvelle analyse SonarCloud
//test declanche
// Importer le module energyQueue pour démarrer les workers
require("./queues/energyQueue"); // Importe et exécute le code automatiquement
// Charger les variables d'environnement
dotenv_1.default.config();
// Initialisation de l'application Express
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000;
// Middleware pour CORS
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
}));
// Middleware pour parser le JSON
app.use(express_1.default.json());
// Route pour exécuter une transaction manuelle
app.post('/api/energy/trade', async (req, res) => {
    var _a, _b;
    try {
        const { type, quantity } = req.body;
        if (!type || !quantity || !['buy', 'sell'].includes(type)) {
            throw new Error('Type ou quantité invalide');
        }
        // Fetch evaluation data
        let soc;
        try {
            const evaluateResponse = await axios_1.default.get('http://localhost:5000/api/evaluate', { timeout: 5000 });
            console.log('Evaluate Response:', evaluateResponse.data);
            const { metrics } = evaluateResponse.data;
            if (!metrics || typeof metrics.soc_final !== 'number') {
                throw new Error('Invalid metrics data');
            }
            soc = metrics.soc_final;
        }
        catch (error) {
            if (error instanceof axios_1.AxiosError) {
                console.error('Error fetching /api/evaluate:', error.message, 'Response:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
            }
            else {
                console.error('Error fetching /api/evaluate:', error);
            }
            throw new Error('Failed to fetch SOC data');
        }
        // Fetch price with error handling
        let price;
        try {
            price = await (0, energyProviderService_1.getLatestPrice)();
            console.log('Price:', price, 'SOC:', soc, 'Quantity:', quantity);
        }
        catch (error) {
            if (error instanceof axios_1.AxiosError) {
                console.error('Error fetching price:', error.message, 'Response:', (_b = error.response) === null || _b === void 0 ? void 0 : _b.data);
            }
            else {
                console.error('Error fetching price:', error);
            }
            throw new Error('Failed to fetch price data');
        }
        if (type === 'buy') {
            if (price >= 0.05)
                throw new Error('Prix trop élevé pour acheter');
            if (soc >= 80)
                throw new Error('SOC trop élevé pour acheter');
            if (quantity > 10)
                throw new Error('Quantité dépasse la limite d\'achat');
        }
        if (type === 'sell' && (price <= 0.12 || soc <= 60 || quantity > 5)) {
            throw new Error('Conditions de vente non remplies');
        }
        const result = await (0, energyProviderService_1.executeManualTrade)(type, quantity);
        res.json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Erreur lors de la transaction:', error.message);
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Erreur lors de la transaction:', error);
            res.status(400).json({ error: 'Unknown error during transaction' });
        }
    }
});
// Nouvelle route pour récupérer le SOC
app.get('/api/energy/soc', async (req, res) => {
    var _a;
    try {
        const evaluateResponse = await axios_1.default.get('http://localhost:5000/api/evaluate', { timeout: 5000 });
        const { metrics } = evaluateResponse.data;
        if (!metrics || typeof metrics.soc_final !== 'number') {
            throw new Error('Invalid metrics data');
        }
        const soc = metrics.soc_final;
        res.json({ soc });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            console.error('Error fetching SOC:', error.message, 'Response:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
        }
        else {
            console.error('Error fetching SOC:', error);
        }
        res.status(500).json({ error: 'Failed to fetch SOC data' });
    }
});
// Route pour récupérer le dernier prix
app.get('/api/energy/prices', async (req, res) => {
    try {
        const price = await (0, energyProviderService_1.getLatestPrice)();
        res.json([{ price }]); // Retourne un tableau [{ price: <valeur> }]
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Unknown error fetching prices' });
        }
    }
});
// Route pour récupérer l'historique des transactions
app.get('/api/energy/transactions', async (req, res) => {
    try {
        const transactions = await (0, energyProviderService_1.getTransactions)();
        res.json(transactions);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Unknown error fetching transactions' });
        }
    }
});
// Route pour récupérer les résultats d'évaluation
app.get('/api/evaluate', async (req, res) => {
    try {
        const pythonApiUrl = 'http://localhost:8001/evaluate';
        const response = await axios_1.default.get(pythonApiUrl);
        res.json(response.data);
    }
    catch (error) {
        console.error('Erreur lors de la requête à FastAPI:', error);
        res.status(500).json({ error: error.message });
    }
});
// Routes existantes
app.use('/api/batteries', batteryRoutes_1.default);
app.use('/api/predictions', predictions_1.default);
app.use('/api/equipment', equipment_1.default);
app.use('/api/tasks', taskRoutes_1.default);
// Route de test
app.get('/', (req, res) => {
    res.send('API de gestion BESS et panneaux solaires');
});
// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});
// Démarrer le serveur
if (require.main === module) {
    const startServer = async () => {
        try {
            await (0, db_1.connectDB)();
            server.listen(PORT, () => {
                console.log(`Serveur démarré sur http://localhost:${PORT}`);
            });
            (0, websocketService_1.startWebSocketServer)(server);
        }
        catch (error) {
            console.error('Erreur lors du démarrage du serveur:', error);
            process.exit(1);
        }
    };
    startServer();
}
