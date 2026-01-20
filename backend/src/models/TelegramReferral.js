import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TelegramReferral = sequelize.define('TelegramReferral', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  referrerWallet: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telegramUserId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  referrerRewarded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  referredRewarded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'telegram_referrals',
  timestamps: false
});

export default TelegramReferral;
