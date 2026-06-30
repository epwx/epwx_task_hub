export default {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('telegram_group_rewards');

    if (!table.txHash) {
      await queryInterface.addColumn('telegram_group_rewards', 'txHash', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.paidAt) {
      await queryInterface.addColumn('telegram_group_rewards', 'paidAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.paidByWallet) {
      await queryInterface.addColumn('telegram_group_rewards', 'paidByWallet', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('telegram_group_rewards');

    if (table.paidByWallet) {
      await queryInterface.removeColumn('telegram_group_rewards', 'paidByWallet');
    }

    if (table.paidAt) {
      await queryInterface.removeColumn('telegram_group_rewards', 'paidAt');
    }

    if (table.txHash) {
      await queryInterface.removeColumn('telegram_group_rewards', 'txHash');
    }
  },
};
