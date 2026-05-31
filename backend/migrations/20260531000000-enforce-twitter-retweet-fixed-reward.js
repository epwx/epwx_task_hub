export default {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE twitter_campaigns
      SET "rewardAmount" = '100000', "updatedAt" = NOW()
      WHERE "rewardAmount" IS DISTINCT FROM '100000';
    `);

    await queryInterface.sequelize.query(`
      UPDATE claims
      SET bill = '100000', "updatedAt" = NOW()
      WHERE "claimType" = 'twitter_retweet'
        AND status = 'pending'
        AND bill IS DISTINCT FROM '100000';
    `);
  },

  down: async () => {},
};