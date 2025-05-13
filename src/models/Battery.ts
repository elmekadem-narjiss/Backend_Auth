import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class Battery extends Model {
  public id!: number;
  public name!: string;
  public capacity!: number;
  public stateOfCharge!: number;
  public chemistry!: string;
  public cycleCount!: number;
  public temperature?: number;
  public manufacturedDate?: Date;
  public lastMaintenance?: Date;
}

Battery.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    stateOfCharge: {
      type: DataTypes.FLOAT,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 100,
      },
    },
    chemistry: {
      type: DataTypes.STRING,
      defaultValue: 'Lithium',
      allowNull: false,
    },
    cycleCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    manufacturedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastMaintenance: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Battery',
    tableName: 'batteries',
  }
);

export default Battery;