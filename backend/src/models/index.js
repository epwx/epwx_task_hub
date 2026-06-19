
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import User from './User.js';
import Campaign from './Campaign.js';
import TaskSubmission from './TaskSubmission.js';
import CashbackClaim from './CashbackClaim.js';
import DailyClaim from './DailyClaim.js';
import DailyDraw from './DailyDraw.js';
import DailyDrawWinner from './DailyDrawWinner.js';
import SpecialClaim from './SpecialClaim.js';
import Merchant from './Merchant.js';
import Claim from './Claim.js';
import TwitterCampaign from './TwitterCampaign.js';
import RewardDistributionLedgerDef from './RewardDistributionLedger.js';
import WalletReferral from './WalletReferral.js';
import PlatformStats from './PlatformStats.js';

const RewardDistributionLedger = RewardDistributionLedgerDef(sequelize, DataTypes);

// Define associations
Campaign.belongsTo(User, { foreignKey: 'advertiserId', as: 'advertiser' });
User.hasMany(Campaign, { foreignKey: 'advertiserId', as: 'campaigns' });

TaskSubmission.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
TaskSubmission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Campaign.hasMany(TaskSubmission, { foreignKey: 'campaignId', as: 'submissions' });
User.hasMany(TaskSubmission, { foreignKey: 'userId', as: 'submissions' });

DailyDraw.hasMany(DailyDrawWinner, { foreignKey: 'drawId', as: 'winners' });
DailyDrawWinner.belongsTo(DailyDraw, { foreignKey: 'drawId', as: 'draw' });

export { User, Campaign, TaskSubmission, CashbackClaim, DailyClaim, DailyDraw, DailyDrawWinner, SpecialClaim, Merchant, Claim, TwitterCampaign, RewardDistributionLedger, WalletReferral, PlatformStats };
