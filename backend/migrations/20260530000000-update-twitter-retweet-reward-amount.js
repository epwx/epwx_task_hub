export default {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE twitter_campaigns
      SET "rewardAmount" = '100000', "updatedAt" = NOW()
      WHERE "rewardAmount" = '1000000';
    `);

    await queryInterface.sequelize.query(`
      UPDATE claims
      SET bill = '100000', "updatedAt" = NOW()
      WHERE "claimType" = 'twitter_retweet'
        AND status = 'pending'
        AND bill = '1000000';
    `);
  },

  down: async () => {},
};