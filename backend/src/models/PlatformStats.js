import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlatformStats = sequelize.define('PlatformStats', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  statsKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  totalClaimsTillNow: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: '0',
  },
  totalEpwxDistributedTillNow: {
    type: DataTypes.DECIMAL(36, 0),
    allowNull: false,
    defaultValue: '0',
  },
}, {
  tableName: 'platform_stats',
  timestamps: true,
});

export default PlatformStats;