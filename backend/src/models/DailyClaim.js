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
  amount: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '100000',
  },
  baseAmount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telegramMember: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  emailBonusAmount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emailBonusBps: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending', // 'pending', 'paid'
  },
  partnerReferralId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'PartnerReferrals',
      key: 'id'
    }
  },
  partnerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Partners',
      key: 'id'
    }
  },
}, {
  indexes: [
    { fields: ['wallet'] },
    { fields: ['ip'] },
    { fields: ['claimedAt'] },
    { fields: ['status', 'claimedAt'] },
    { fields: ['partnerId'] },
    { fields: ['partnerReferralId'] },
  ],
  tableName: 'daily_claims',
  timestamps: false,
});

export default DailyClaim;
