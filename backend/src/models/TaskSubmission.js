const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskSubmission = sequelize.define('TaskSubmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  completionId: {
    type: DataTypes.INTEGER,
    comment: 'On-chain completion ID'
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: true, // Made nullable - using blockchain campaign IDs in metadata instead
    references: {
      model: 'campaigns',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  proofUrl: {
    type: DataTypes.STRING,
    comment: 'URL of the completed action (tweet, repost, etc.)'
  },
  proofScreenshot: {
    type: DataTypes.STRING,
    comment: 'URL to screenshot proof'
  },
  status: {
    type: DataTypes.ENUM('pending', 'verifying', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  verifiedAt: {
    type: DataTypes.DATE
  },
  verifiedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rejectionReason: {
    type: DataTypes.TEXT
  },
  rewardAmount: {
    type: DataTypes.DECIMAL(30, 0)
  },
  transactionHash: {
    type: DataTypes.STRING
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'task_submissions',
  timestamps: true,
  indexes: [
    { fields: ['campaignId'] },
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = TaskSubmission;
