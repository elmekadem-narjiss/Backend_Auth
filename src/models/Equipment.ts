import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface EquipmentAttributes {
  equipmentId: string;
  type: string;
  createdAt?: Date;
}

interface EquipmentCreationAttributes extends Optional<EquipmentAttributes, 'createdAt'> {}

class Equipment extends Model<EquipmentAttributes, EquipmentCreationAttributes> implements EquipmentAttributes {
  public equipmentId!: string;
  public type!: string;
  public createdAt!: Date;
}

Equipment.init(
  {
    equipmentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'equipments',
    timestamps: false,
  }
);

export default Equipment;