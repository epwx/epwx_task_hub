import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WalletReferral = sequelize.define('WalletReferral', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  referrerWallet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  referredWallet: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  registrationIp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  claimIp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rewardAmount: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1000000',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  referrerRewardStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  referredRewardStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  referrerRewardTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  referredRewardTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  disqualificationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  qualifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rewardedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  referredFirstClaimId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  referredFirstClaimedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'wallet_referrals',
  indexes: [
    { fields: ['referrerWallet'] },
    { fields: ['referredWallet'], unique: true },
    { fields: ['status'] },
    { fields: ['referrerRewardStatus'] },
    { fields: ['referredRewardStatus'] },
  ],
});

export default WalletReferral;