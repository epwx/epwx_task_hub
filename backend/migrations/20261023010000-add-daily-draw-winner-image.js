export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('daily_draw_announcements', 'winnerImage', {
      type: Sequelize.BLOB, allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('daily_draw_announcements', 'winnerImage');
  },
};
