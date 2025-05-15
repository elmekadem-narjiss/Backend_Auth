import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

interface EquipmentMetricsAttributes {
  id?: number;
  equipmentId: string;
  type: string;
  timestamp: Date;
  cpuUsage?: number;
  ramUsage?: number;
  storageUsed?: number;
  energyProduced?: number;
  temperature?: number;
  humidity?: number;
}

class EquipmentMetrics extends Model<EquipmentMetricsAttributes> implements EquipmentMetricsAttributes {
  public id!: number;
  public equipmentId!: string;
  public type!: string;
  public timestamp!: Date;
  public cpuUsage?: number;
  public ramUsage?: number;
  public storageUsed?: number;
  public energyProduced?: number;
  public temperature?: number;
  public humidity?: number;
}

EquipmentMetrics.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    equipmentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    cpuUsage: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    ramUsage: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    storageUsed: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    energyProduced: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'equipment_metrics',
    timestamps: false,
  }
);

export default EquipmentMetrics;