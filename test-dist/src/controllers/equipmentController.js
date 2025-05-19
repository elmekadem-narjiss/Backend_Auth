"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEquipmentData = void 0;
const equipmentMetrics_1 = __importDefault(require("../models/equipmentMetrics"));
const getEquipmentData = async (req, res) => {
    try {
        const equipmentData = await equipmentMetrics_1.default.findAll({
            order: [['timestamp', 'DESC']],
        });
        res.status(200).json(equipmentData);
    }
    catch (error) {
        console.error('Error fetching equipment data:', error);
        res.status(500).json({ error: 'Failed to fetch equipment data' });
    }
};
exports.getEquipmentData = getEquipmentData;
