"use strict";
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
// Routes
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
// Démarrer le serveur (exécuté uniquement si ce fichier est le point d'entrée principal)
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
