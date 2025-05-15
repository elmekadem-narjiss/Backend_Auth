"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../config/db"));
class EquipmentMetrics extends sequelize_1.Model {
}
EquipmentMetrics.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    equipmentId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    cpuUsage: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    ramUsage: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    storageUsed: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    energyProduced: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    temperature: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    humidity: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
}, {
    sequelize: db_1.default,
    tableName: 'equipment_metrics',
    timestamps: false,
});
exports.default = EquipmentMetrics;
