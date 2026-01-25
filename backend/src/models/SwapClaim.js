import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SwapClaim = sequelize.define('SwapClaim', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  wallet: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.STRING, allowNull: false }, // EPWX amount
  claimAmount: { type: DataTypes.STRING, allowNull: false }, // 1% of amount
  status: { type: DataTypes.ENUM('pending', 'paid'), defaultValue: 'pending' },
  claimedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'swap_claims',
  timestamps: false,
});

export default SwapClaim;
