import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TelegramGroupOwner = sequelize.define('TelegramGroupOwner', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  groupId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  groupTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ownerTelegramUserId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ownerWallet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'telegram_group_owners',
  timestamps: true,
  indexes: [
    { fields: ['groupId'], unique: true },
    { fields: ['ownerWallet'] },
    { fields: ['ownerTelegramUserId'] },
    { fields: ['status'] },
  ],
});

export default TelegramGroupOwner;
