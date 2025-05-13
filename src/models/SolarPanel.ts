import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class SolarPanel extends Model {
  public id!: number;
  public name!: string;
  public powerOutput!: number;
  public efficiency!: number;
}

SolarPanel.init(
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
    powerOutput: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    efficiency: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SolarPanel',
    tableName: 'solar_panels',
  }
);

export default SolarPanel;