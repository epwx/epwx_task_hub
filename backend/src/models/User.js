import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  walletAddress: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/
    }
  },
  twitterId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'advertiser', 'admin'),
    defaultValue: 'user'
  },
  totalEarned: {
    type: DataTypes.DECIMAL(30, 0),
    defaultValue: 0
  },
  tasksCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reputationScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true
});

export default User;
