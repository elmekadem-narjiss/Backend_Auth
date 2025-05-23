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
// Charger les variables d'environnement dès le début
dotenv_1.default.config();
// Vérifier les variables d'environnement critiques
console.log('PG_DBNAME:', process.env.PG_DBNAME);
console.log('PG_USER:', process.env.PG_USER);
console.log('PG_PASSWORD:', process.env.PG_PASSWORD);
console.log('PG_HOST:', process.env.PG_HOST);
console.log('PG_PORT:', process.env.PG_PORT);
console.log('PORT:', process.env.PORT);
// Initialisation de l'application Express
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000; // Align with the port used in previous tests
// Middleware pour CORS
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Origine du frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Include PATCH since taskRoutes uses it
    allowedHeaders: ['Content-Type'], // En-têtes autorisés
    credentials: true, // Allow credentials if needed (e.g., cookies, auth headers)
}));
// Middleware pour parser le JSON
app.use(express_1.default.json());
// Routes
app.use('/api/batteries', batteryRoutes_1.default);
app.use('/api/predictions', predictions_1.default);
app.use('/api/equipment', equipment_1.default);
app.use('/api/tasks', taskRoutes_1.default); // Adjusted to match the endpoint used in tests (http://localhost:3001/tasks)
// Route de test
app.get('/', (req, res) => {
    res.send('API de gestion BESS et panneaux solaires');
});
// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});
// Démarrer le serveur et la connexion à la base de données
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.connectDB)(); // Connexion à la base de données
        server.listen(PORT, () => {
            console.log(`Serveur démarré sur http://localhost:${PORT}`);
        });
        (0, websocketService_1.startWebSocketServer)(server); // Démarrer le serveur WebSocket
    }
    catch (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
        process.exit(1); // Arrêter le processus en cas d'erreur critique
    }
});
startServer();
