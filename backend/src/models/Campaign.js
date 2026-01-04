import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'On-chain campaign ID'
  },
  advertiserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  taskType: {
    type: DataTypes.ENUM('like', 'repost', 'comment', 'follow', 'quote'),
    allowNull: false
  },
  targetUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rewardPerTask: {
    type: DataTypes.DECIMAL(30, 0),
    allowNull: false
  },
  maxCompletions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  completedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalBudget: {
    type: DataTypes.DECIMAL(30, 0),
    allowNull: false
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled', 'expired'),
    defaultValue: 'pending'
  },
  transactionHash: {
    type: DataTypes.STRING
  },
  requirements: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'campaigns',
  timestamps: true,
  indexes: [
    { fields: ['advertiserId'] },
    { fields: ['status'] },
    { fields: ['taskType'] },
    { fields: ['deadline'] }
  ]
});

export default Campaign;
