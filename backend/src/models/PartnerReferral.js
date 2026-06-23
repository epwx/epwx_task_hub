import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PartnerReferral = sequelize.define('PartnerReferral', {
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
  referralLink: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  referralCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  firstClaimDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastClaimDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalClaimsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalPartnerEarnings: {
    type: DataTypes.DECIMAL(30, 0),
    defaultValue: 0
  }
}, {
  tableName: 'PartnerReferrals',
  timestamps: true,
  indexes: [
    { fields: ['partnerId'] },
    { fields: ['userId'] },
    { fields: ['referralCode'] }
  ]
});

export default PartnerReferral;
