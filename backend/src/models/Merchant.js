import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Merchant = sequelize.define('Merchant', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  wallet: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'merchants',
  timestamps: true,
});

export default Merchant;
