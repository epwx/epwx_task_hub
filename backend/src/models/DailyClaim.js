import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyClaim = sequelize.define('DailyClaim', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  wallet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  claimedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending', // 'pending', 'paid'
  },
}, {
  indexes: [
    { fields: ['wallet'] },
    { fields: ['ip'] },
  ],
  tableName: 'daily_claims',
  timestamps: false,
});

export default DailyClaim;
