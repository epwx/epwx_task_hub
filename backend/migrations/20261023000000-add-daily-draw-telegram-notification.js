export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('daily_draw_announcements', 'telegramStatus', {
        type: Sequelize.STRING, allowNull: true,
      }, { transaction });
      await queryInterface.addColumn('daily_draw_announcements', 'telegramNotifiedAt', {
        type: Sequelize.DATE, allowNull: true,
      }, { transaction });
      await queryInterface.addColumn('daily_draw_announcements', 'telegramErrorCode', {
        type: Sequelize.STRING, allowNull: true,
      }, { transaction });
      await queryInterface.bulkUpdate('daily_draw_announcements', {
        telegramStatus: 'skipped',
      }, { status: 'published' }, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const column of ['telegramErrorCode', 'telegramNotifiedAt', 'telegramStatus']) {
        await queryInterface.removeColumn('daily_draw_announcements', column, { transaction });
      }
    });
  },
};
