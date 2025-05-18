"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../config/db"));
class Battery extends sequelize_1.Model {
}
Battery.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    capacity: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    stateOfCharge: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 100,
        validate: {
            min: 0,
            max: 100,
        },
    },
    chemistry: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'Lithium',
        allowNull: false,
    },
    cycleCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    temperature: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    manufacturedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lastMaintenance: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: db_1.default,
    modelName: 'Battery',
    tableName: 'batteries',
});
exports.default = Battery;
