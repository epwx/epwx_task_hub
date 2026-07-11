import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Partner = sequelize.define('Partner', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  verificationImagePath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to Twitter followers screenshot'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for rejection if rejected'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Admin wallet address who approved'
  },
  telegramChannel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  xProfile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalEarnings: {
    type: DataTypes.DECIMAL(30, 0),
    defaultValue: 0
  },
  totalReferredUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'Partners',
  timestamps: true,
  indexes: [
    { fields: ['status'] }
  ]
});

export default Partner;
