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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBattery = exports.updateBattery = exports.createBattery = exports.getBatteryById = exports.getAllBatteries = void 0;
const batteryService = __importStar(require("../services/batteryService"));
const getAllBatteries = async (req, res) => {
    try {
        const batteries = await batteryService.getAllBatteries();
        res.json(batteries);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des batteries' });
    }
};
exports.getAllBatteries = getAllBatteries;
const getBatteryById = async (req, res) => {
    try {
        const battery = await batteryService.getBatteryById(Number(req.params.id));
        if (!battery) {
            return res.status(404).json({ error: 'Batterie non trouvée' });
        }
        res.json(battery);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération de la batterie' });
    }
};
exports.getBatteryById = getBatteryById;
const createBattery = async (req, res) => {
    try {
        const battery = await batteryService.createBattery(req.body);
        res.status(201).json(battery);
    }
    catch (error) {
        res.status(400).json({ error: 'Erreur lors de la création de la batterie' });
    }
};
exports.createBattery = createBattery;
const updateBattery = async (req, res) => {
    try {
        const battery = await batteryService.updateBattery(Number(req.params.id), req.body);
        if (!battery) {
            return res.status(404).json({ error: 'Batterie non trouvée' });
        }
        res.json(battery);
    }
    catch (error) {
        res.status(400).json({ error: 'Erreur lors de la mise à jour de la batterie' });
    }
};
exports.updateBattery = updateBattery;
const deleteBattery = async (req, res) => {
    try {
        const success = await batteryService.deleteBattery(Number(req.params.id));
        if (!success) {
            return res.status(404).json({ error: 'Batterie non trouvée' });
        }
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: 'Erreur lors de la suppression de la batterie' });
    }
};
exports.deleteBattery = deleteBattery;
