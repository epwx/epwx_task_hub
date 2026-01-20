export default {
  up: async (queryInterface, Sequelize) => {
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
    await queryInterface.addIndex('telegram_referrals', ['referrerWallet']);
    await queryInterface.addIndex('telegram_referrals', ['telegramUserId']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('telegram_referrals');
  }
};
