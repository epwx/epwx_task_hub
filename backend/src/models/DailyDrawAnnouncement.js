import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyDrawAnnouncement = sequelize.define('DailyDrawAnnouncement', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  drawId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'daily_draws', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  postId: { type: DataTypes.STRING, allowNull: true },
  publishedAt: { type: DataTypes.DATE, allowNull: true },
  nextAttemptAt: { type: DataTypes.DATE, allowNull: true },
  errorCode: { type: DataTypes.STRING, allowNull: true },
  deleteStatus: { type: DataTypes.STRING, allowNull: true },
  deleteAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  deletedAt: { type: DataTypes.DATE, allowNull: true },
  deleteNextAttemptAt: { type: DataTypes.DATE, allowNull: true },
  deleteErrorCode: { type: DataTypes.STRING, allowNull: true },
  telegramStatus: { type: DataTypes.STRING, allowNull: true },
  telegramNotifiedAt: { type: DataTypes.DATE, allowNull: true },
  telegramErrorCode: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'daily_draw_announcements',
  timestamps: true,
});

export default DailyDrawAnnouncement;
