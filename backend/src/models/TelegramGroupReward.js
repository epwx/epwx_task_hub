import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TelegramGroupReward = sequelize.define('TelegramGroupReward', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  groupOwnerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'telegram_group_owners',
      key: 'id',
    },
  },
  groupId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ownerWallet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  claimantWallet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  claimantTelegramUserId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dailyClaimId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'daily_claims',
      key: 'id',
    },
  },
  rewardAmount: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '10000',
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'blocked'),
    allowNull: false,
    defaultValue: 'pending',
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paidByWallet: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'telegram_group_rewards',
  timestamps: true,
  indexes: [
    { fields: ['groupOwnerId'] },
    { fields: ['groupId'] },
    { fields: ['ownerWallet'] },
    { fields: ['status'] },
    { fields: ['claimantTelegramUserId'] },
    { fields: ['dailyClaimId'], unique: true },
  ],
});

export default TelegramGroupReward;
