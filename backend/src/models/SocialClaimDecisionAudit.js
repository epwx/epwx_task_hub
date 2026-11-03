import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SocialClaimDecisionAudit = sequelize.define('SocialClaimDecisionAudit', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  claimId: { type: DataTypes.INTEGER, allowNull: false },
  actor: { type: DataTypes.STRING, allowNull: false },
  previousDecision: { type: DataTypes.STRING, allowNull: true },
  nextDecision: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'social_claim_decision_audits',
  timestamps: true,
});

export default SocialClaimDecisionAudit;
