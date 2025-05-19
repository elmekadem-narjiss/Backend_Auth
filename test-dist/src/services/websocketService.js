"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebSocketServer = startWebSocketServer;
const ws_1 = require("ws");
const equipmentMetrics_1 = __importDefault(require("../models/equipmentMetrics"));
function startWebSocketServer(httpServer) {
    const wss = new ws_1.Server({ server: httpServer });
    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');
        ws.on('close', () => console.log('WebSocket client disconnected'));
    });
    // Polling pour détecter les nouvelles données
    let lastCheckedTimestamp = new Date();
    setInterval(async () => {
        try {
            const newRecords = await equipmentMetrics_1.default.findAll({
                where: {
                    timestamp: {
                        [Symbol.for('gt')]: lastCheckedTimestamp,
                    },
                },
            });
            if (newRecords.length > 0) {
                const newMetrics = newRecords.map((record) => ({
                    equipmentId: record.equipmentId,
                    type: record.type,
                    metrics: [
                        {
                            timestamp: record.timestamp.toISOString(),
                            metrics: {
                                cpuUsage: record.cpuUsage,
                                ramUsage: record.ramUsage,
                                storageUsed: record.storageUsed,
                                energyProduced: record.energyProduced,
                                temperature: record.temperature,
                                humidity: record.humidity,
                            },
                        },
                    ],
                }));
                newMetrics.forEach((metrics) => {
                    wss.clients.forEach((client) => {
                        if (client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(JSON.stringify(metrics));
                        }
                    });
                });
                console.log('New metrics detected:', newMetrics);
                lastCheckedTimestamp = newRecords[newRecords.length - 1].timestamp;
            }
        }
        catch (error) {
            console.error('Error polling for new metrics:', error);
        }
    }, 10000); // Vérifie toutes les 10 secondes
    // Simulation périodique des données (optionnel, à retirer si PostgreSQL est utilisé)
    setInterval(async () => {
        try {
            const newMetrics = {
                equipmentId: `EQ${Math.floor(Math.random() * 3) + 1}`, // EQ1, EQ2, EQ3
                type: Math.random() > 0.5 ? 'server' : Math.random() > 0.5 ? 'panel' : 'sensor',
                metrics: [
                    {
                        timestamp: new Date().toISOString(),
                        metrics: {
                            cpuUsage: Math.random() > 0.5 ? Math.random() * 100 : undefined,
                            ramUsage: Math.random() > 0.5 ? Math.random() * 100 : undefined,
                            storageUsed: Math.random() > 0.5 ? Math.random() * 200 : undefined,
                            energyProduced: Math.random() > 0.5 ? Math.random() * 50 : undefined,
                            temperature: Math.random() > 0.5 ? Math.random() * 40 : undefined,
                            humidity: Math.random() > 0.5 ? Math.random() * 100 : undefined,
                        },
                    },
                ],
            };
            // Insérer dans la base de données
            await equipmentMetrics_1.default.create({
                equipmentId: newMetrics.equipmentId,
                type: newMetrics.type,
                timestamp: new Date(newMetrics.metrics[0].timestamp),
                cpuUsage: newMetrics.metrics[0].metrics.cpuUsage,
                ramUsage: newMetrics.metrics[0].metrics.ramUsage,
                storageUsed: newMetrics.metrics[0].metrics.storageUsed,
                energyProduced: newMetrics.metrics[0].metrics.energyProduced,
                temperature: newMetrics.metrics[0].metrics.temperature,
                humidity: newMetrics.metrics[0].metrics.humidity,
            });
            console.log('Simulated and inserted new metrics:', newMetrics);
        }
        catch (error) {
            console.error('Simulation error:', error);
        }
    }, 15000); // Simule toutes les 15 secondes
    return wss;
}
