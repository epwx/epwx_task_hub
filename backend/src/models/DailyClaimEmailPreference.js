import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyClaimEmailPreference = sequelize.define('DailyClaimEmailPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  wallet: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true },
  },
  emailVerifiedAt: DataTypes.DATE,
  verificationTokenHash: {
    type: DataTypes.STRING(64),
    unique: true,
  },
  verificationExpiresAt: DataTypes.DATE,
  unsubscribeTokenHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  remindersEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  successEmailsEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'UTC',
  },
  unsubscribedAt: DataTypes.DATE,
  lastSuccessClaimId: DataTypes.INTEGER,
  lastReminderClaimId: DataTypes.INTEGER,
}, {
  tableName: 'daily_claim_email_preferences',
  timestamps: true,
});

export default DailyClaimEmailPreference;