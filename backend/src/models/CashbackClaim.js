const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashbackClaim = sequelize.define('CashbackClaim', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  wallet: { type: DataTypes.STRING, allowNull: false },
  txHash: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.STRING, allowNull: false }, // EPWX amount
  cashbackAmount: { type: DataTypes.STRING, allowNull: false }, // 3% of amount
  status: { type: DataTypes.ENUM('pending', 'paid'), defaultValue: 'pending' },
  claimedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'cashback_claims',
  timestamps: false,
});

module.exports = CashbackClaim;
