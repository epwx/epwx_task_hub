import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SocialClaimVerificationAttempt = sequelize.define('SocialClaimVerificationAttempt', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  claimId: { type: DataTypes.INTEGER, allowNull: false },
  attemptNumber: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  provider: { type: DataTypes.STRING, allowNull: true },
  model: { type: DataTypes.STRING, allowNull: true },
  rubricVersion: { type: DataTypes.STRING, allowNull: false },
  decision: { type: DataTypes.STRING, allowNull: true },
  confidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
  signals: { type: DataTypes.JSONB, allowNull: true },
  reasonCodes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  errorCode: { type: DataTypes.STRING, allowNull: true },
  startedAt: { type: DataTypes.DATE, allowNull: false },
  completedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'social_claim_verification_attempts',
  timestamps: true,
});

export default SocialClaimVerificationAttempt;
