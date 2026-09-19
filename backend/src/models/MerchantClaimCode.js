import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MerchantClaimCode = sequelize.define('MerchantClaimCode', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  merchantId: { type: DataTypes.INTEGER, allowNull: false },
  codeHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  codeLastFour: { type: DataTypes.STRING(4), allowNull: false },
  authorizationHash: { type: DataTypes.STRING(64), allowNull: true, unique: true },
  rewardAmount: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  redeemedAt: { type: DataTypes.DATE, allowNull: true },
  redeemedBy: { type: DataTypes.STRING, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'merchant_claim_codes',
  timestamps: true,
});

export default MerchantClaimCode;