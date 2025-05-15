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
const Equipment_1 = __importDefault(require("../models/Equipment"));
const influx_1 = require("../services/influx");
const router = express_1.default.Router();
// Simulate Equipment Data
function simulateEquipmentData() {
    const equipmentTypes = ['sensor', 'panel', 'cpu', 'ram', 'storage'];
    const data = [];
    for (let i = 1; i <= 5; i++) {
        const type = equipmentTypes[i - 1]; // One of each type
        const metrics = {};
        if (type === 'sensor') {
            metrics.temperature = 20 + Math.random() * 20; // 20–40°C
            metrics.humidity = 30 + Math.random() * 50; // 30–80%
        }
        else if (type === 'panel') {
            metrics.energyProduced = 20 + Math.random() * 30; // 20–50 kWh (daily, 10 kW array)
        }
        else if (type === 'cpu') {
            metrics.cpuUsage = Math.random() * 100; // 0–100%
        }
        else if (type === 'ram') {
            metrics.ramUsage = Math.random() * 100; // 0–100%
        }
        else if (type === 'storage') {
            metrics.storageUsed = Math.random() * 1000; // 0–1000 GB
            metrics.storageTotal = 1000; // Fixed total
        }
        data.push({
            equipmentId: `EQ${i}`,
            type,
            metrics,
        });
    }
    return data;
}
// Get Equipment Data
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipments = yield Equipment_1.default.findAll();
        const equipmentData = [];
        for (const equip of equipments) {
            const metrics = yield (0, influx_1.queryEquipmentMetrics)(equip.equipmentId, equip.type, '1h');
            equipmentData.push({
                equipmentId: equip.equipmentId,
                type: equip.type,
                metrics,
            });
        }
        res.json(equipmentData);
    }
    catch (err) {
        console.error('Error fetching equipment:', err);
        res.status(500).json({ error: 'Error fetching equipment data' });
    }
}));
// Simulate and Store Data
router.post('/simulate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const simulatedData = simulateEquipmentData();
        // Clear existing data
        yield Equipment_1.default.destroy({ where: {} });
        for (const data of simulatedData) {
            yield Equipment_1.default.create({ equipmentId: data.equipmentId, type: data.type });
            (0, influx_1.writeEquipmentMetrics)(data.equipmentId, data.type, data.metrics);
        }
        yield (0, influx_1.flushWrites)();
        res.json(simulatedData);
    }
    catch (err) {
        console.error('Error simulating equipment:', err);
        res.status(500).json({ error: 'Error simulating data' });
    }
}));
exports.default = router;
