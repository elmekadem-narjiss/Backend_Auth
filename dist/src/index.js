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
const http_1 = require("http");
const websocketService_1 = require("./services/websocketService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({ origin: 'http://localhost:3000' }));
app.use(express_1.default.json());
app.use('/api/batteries', batteryRoutes_1.default);
app.use('/api/predictions', predictions_1.default);
app.use('/api/equipment', equipment_1.default);
app.get('/', (req, res) => {
    res.send('API de gestion BESS et panneaux solaires');
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.connectDB)();
        server.listen(PORT, () => {
            console.log(`Serveur démarré sur http://localhost:${PORT}`);
        });
        (0, websocketService_1.startWebSocketServer)(server);
    }
    catch (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
    }
});
startServer();
