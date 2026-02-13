import User from './User.js';
import Campaign from './Campaign.js';
import TaskSubmission from './TaskSubmission.js';
import CashbackClaim from './CashbackClaim.js';
import DailyClaim from './DailyClaim.js';
import SpecialClaim from './SpecialClaim.js';
import TelegramReferral from './TelegramReferral.js';
import Merchant from './Merchant.js';
import Claim from './Claim.js';

// Define associations
Campaign.belongsTo(User, { foreignKey: 'advertiserId', as: 'advertiser' });
User.hasMany(Campaign, { foreignKey: 'advertiserId', as: 'campaigns' });

TaskSubmission.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
TaskSubmission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Campaign.hasMany(TaskSubmission, { foreignKey: 'campaignId', as: 'submissions' });
User.hasMany(TaskSubmission, { foreignKey: 'userId', as: 'submissions' });

export { User, Campaign, TaskSubmission, CashbackClaim, DailyClaim, SpecialClaim, TelegramReferral, Merchant, Claim };
