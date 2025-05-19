"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBattery = exports.updateBattery = exports.createBattery = exports.getBatteryById = exports.getAllBatteries = void 0;
const Battery_1 = __importDefault(require("../models/Battery"));
const getAllBatteries = async () => {
    return await Battery_1.default.findAll();
};
exports.getAllBatteries = getAllBatteries;
const getBatteryById = async (id) => {
    return await Battery_1.default.findByPk(id);
};
exports.getBatteryById = getBatteryById;
const createBattery = async (data) => {
    return await Battery_1.default.create(data);
};
exports.createBattery = createBattery;
const updateBattery = async (id, data) => {
    const battery = await Battery_1.default.findByPk(id);
    if (!battery) {
        return null;
    }
    await battery.update(data);
    return battery;
};
exports.updateBattery = updateBattery;
const deleteBattery = async (id) => {
    const battery = await Battery_1.default.findByPk(id);
    if (!battery) {
        return false;
    }
    await battery.destroy();
    return true;
};
exports.deleteBattery = deleteBattery;
