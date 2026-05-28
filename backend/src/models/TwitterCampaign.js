import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TwitterCampaign = sequelize.define('TwitterCampaign', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  title: { type: DataTypes.STRING, allowNull: false },
  tweetUrl: { type: DataTypes.STRING, allowNull: false },
  rewardAmount: { type: DataTypes.STRING, allowNull: false, defaultValue: '1000000' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'twitter_campaigns',
  timestamps: true,
});

export default TwitterCampaign;