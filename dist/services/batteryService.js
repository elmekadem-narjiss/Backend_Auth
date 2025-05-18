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
exports.deleteBattery = exports.updateBattery = exports.createBattery = exports.getBatteryById = exports.getAllBatteries = void 0;
const Battery_1 = __importDefault(require("../models/Battery"));
const getAllBatteries = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield Battery_1.default.findAll();
});
exports.getAllBatteries = getAllBatteries;
const getBatteryById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Battery_1.default.findByPk(id);
});
exports.getBatteryById = getBatteryById;
const createBattery = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Battery_1.default.create(data);
});
exports.createBattery = createBattery;
const updateBattery = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const battery = yield Battery_1.default.findByPk(id);
    if (!battery) {
        return null;
    }
    yield battery.update(data);
    return battery;
});
exports.updateBattery = updateBattery;
const deleteBattery = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const battery = yield Battery_1.default.findByPk(id);
    if (!battery) {
        return false;
    }
    yield battery.destroy();
    return true;
});
exports.deleteBattery = deleteBattery;
