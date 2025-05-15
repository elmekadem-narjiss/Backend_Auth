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
exports.getEquipmentData = void 0;
const equipmentMetrics_1 = __importDefault(require("../models/equipmentMetrics"));
const getEquipmentData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipmentData = yield equipmentMetrics_1.default.findAll({
            order: [['timestamp', 'DESC']],
        });
        res.status(200).json(equipmentData);
    }
    catch (error) {
        console.error('Error fetching equipment data:', error);
        res.status(500).json({ error: 'Failed to fetch equipment data' });
    }
});
exports.getEquipmentData = getEquipmentData;
