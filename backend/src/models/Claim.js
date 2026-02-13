import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Claim = sequelize.define('Claim', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  merchantId: { type: DataTypes.INTEGER, allowNull: false },
  customer: { type: DataTypes.STRING, allowNull: false },
  bill: { type: DataTypes.STRING },
  lat: { type: DataTypes.FLOAT, allowNull: false },
  lng: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'claims',
  timestamps: true,
});

export default Claim;
