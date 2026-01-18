import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SpecialClaim = sequelize.define('SpecialClaim', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  wallet: { type: DataTypes.STRING, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  claimedAt: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'claimed', 'expired'), defaultValue: 'pending' },
}, {
  tableName: 'special_claims',
  timestamps: false,
  indexes: [
    { fields: ['wallet'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ],
});

export default SpecialClaim;
