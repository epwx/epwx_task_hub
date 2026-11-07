import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SecurityAuthorization = sequelize.define('SecurityAuthorization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  authorizationHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  walletAddress: {
    type: DataTypes.STRING(42),
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'security_authorizations',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['walletAddress'] },
    { fields: ['purpose'] },
    { fields: ['expiresAt'] },
  ],
});

export default SecurityAuthorization;
