const User = require('./User');
const Campaign = require('./Campaign');
const TaskSubmission = require('./TaskSubmission');

// Define associations
Campaign.belongsTo(User, { foreignKey: 'advertiserId', as: 'advertiser' });
User.hasMany(Campaign, { foreignKey: 'advertiserId', as: 'campaigns' });

TaskSubmission.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
TaskSubmission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Campaign.hasMany(TaskSubmission, { foreignKey: 'campaignId', as: 'submissions' });
User.hasMany(TaskSubmission, { foreignKey: 'userId', as: 'submissions' });

module.exports = {
  User,
  Campaign,
  TaskSubmission
};
