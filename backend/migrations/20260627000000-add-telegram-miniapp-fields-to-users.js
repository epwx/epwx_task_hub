export default {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('users');

    if (!table.telegramUserId) {
      await queryInterface.addColumn('users', 'telegramUserId', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      });
    }

    if (!table.telegramUsername) {
      await queryInterface.addColumn('users', 'telegramUsername', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('users');

    if (table.telegramUsername) {
      await queryInterface.removeColumn('users', 'telegramUsername');
    }

    if (table.telegramUserId) {
      await queryInterface.removeColumn('users', 'telegramUserId');
    }
  }
};