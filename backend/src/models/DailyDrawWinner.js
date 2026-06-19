import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyDrawWinner = sequelize.define('DailyDrawWinner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  drawId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dailyClaimId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  wallet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  prizeAmount: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'daily_draw_winners',
  timestamps: true,
});

export default DailyDrawWinner;
