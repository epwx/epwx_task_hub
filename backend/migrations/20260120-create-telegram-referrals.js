export default {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.telegram_referrals') as exists;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!tableExists[0].exists) {
      await queryInterface.createTable('telegram_referrals', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        referrerWallet: {
          type: Sequelize.STRING,
          allowNull: false
        },
        telegramUserId: {
          type: Sequelize.STRING,
          allowNull: false
        },
        joinedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        referrerRewarded: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        referredRewarded: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        }
      });
    }
    // Add indexes if not exist
    const indexes = await queryInterface.showIndex('telegram_referrals');
    const indexNames = indexes.map(idx => idx.name.toLowerCase());
    if (!indexNames.includes('telegram_referrals_referrer_wallet')) {
      await queryInterface.addIndex('telegram_referrals', ['referrerWallet']);
    }
    if (!indexNames.includes('telegram_referrals_telegram_user_id')) {
      await queryInterface.addIndex('telegram_referrals', ['telegramUserId']);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('telegram_referrals');
  }
};
