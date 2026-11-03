import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Claim = sequelize.define('Claim', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  merchantId: { type: DataTypes.INTEGER, allowNull: true },
  merchantClaimCodeId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
  customer: { type: DataTypes.STRING, allowNull: false },
  customerEmail: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
  emailNotificationConsent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  lastEmailNotificationStatus: { type: DataTypes.STRING, allowNull: true },
  bill: { type: DataTypes.STRING },
  lat: { type: DataTypes.FLOAT, allowNull: true },
  lng: { type: DataTypes.FLOAT, allowNull: true },
  claimType: { type: DataTypes.STRING, allowNull: false, defaultValue: 'merchant' },
  campaignCode: { type: DataTypes.STRING, allowNull: true },
  twitterCampaignId: { type: DataTypes.INTEGER, allowNull: true },
  twitterUsername: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  ip: { type: DataTypes.STRING, allowNull: false },
  receiptImage: { type: DataTypes.STRING, allowNull: true }, // Path or URL to uploaded receipt image
  rejectionComment: { type: DataTypes.STRING, allowNull: true },
  verificationStatus: { type: DataTypes.STRING, allowNull: true },
  verificationDecision: { type: DataTypes.STRING, allowNull: true },
  verificationConfidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
  verificationCompletedAt: { type: DataTypes.DATE, allowNull: true },
  verificationLeaseUntil: { type: DataTypes.DATE, allowNull: true },
  verificationNextAttemptAt: { type: DataTypes.DATE, allowNull: true },
  verificationAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
  approvedBy: { type: DataTypes.STRING, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  txHash: { type: DataTypes.STRING, allowNull: true },
  payoutStatus: { type: DataTypes.STRING, allowNull: true },
  payoutLeaseUntil: { type: DataTypes.DATE, allowNull: true },
  payoutLastError: { type: DataTypes.STRING, allowNull: true },
  proofSha256: { type: DataTypes.STRING(64), allowNull: true },
  proofPerceptualHash: { type: DataTypes.STRING(16), allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'claims',
  timestamps: true,
});

export default Claim;
