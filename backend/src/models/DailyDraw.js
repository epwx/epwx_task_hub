import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyDraw = sequelize.define('DailyDraw', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  drawDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
  },
  winnerCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  eligibleCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  prizeAmount: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '100000',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'completed',
  },
  runBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  runAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'daily_draws',
  timestamps: true,
});

export default DailyDraw;
