import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PartnerEarning = sequelize.define('PartnerEarning', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  partnerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Partners',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  referralId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'PartnerReferrals',
      key: 'id'
    }
  },
  claimDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  cycleNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Which 30-day cycle this earning belongs to (0, 1, 2...)'
  },
  amount: {
    type: DataTypes.DECIMAL(30, 0),
    allowNull: false,
    defaultValue: '100000000000'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'reversed'),
    defaultValue: 'pending'
  },
  transactionHash: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'PartnerEarnings',
  timestamps: true,
  indexes: [
    { fields: ['partnerId'] },
    { fields: ['userId'] },
    { fields: ['referralId'] },
    { fields: ['status'] },
    { fields: ['claimDate'] }
  ]
});

export default PartnerEarning;
