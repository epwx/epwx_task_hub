const columns = ['deleteStatus', 'deleteAttempts', 'deletedAt', 'deleteNextAttemptAt', 'deleteErrorCode'];

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('daily_draw_announcements', 'deleteStatus', { type: Sequelize.STRING, allowNull: true }, { transaction });
      await queryInterface.addColumn('daily_draw_announcements', 'deleteAttempts', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }, { transaction });
      await queryInterface.addColumn('daily_draw_announcements', 'deletedAt', { type: Sequelize.DATE, allowNull: true }, { transaction });
      await queryInterface.addColumn('daily_draw_announcements', 'deleteNextAttemptAt', { type: Sequelize.DATE, allowNull: true }, { transaction });
      await queryInterface.addColumn('daily_draw_announcements', 'deleteErrorCode', { type: Sequelize.STRING, allowNull: true }, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const column of columns) {
        await queryInterface.removeColumn('daily_draw_announcements', column, { transaction });
      }
    });
  },
};
