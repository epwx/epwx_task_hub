export default {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('daily_claims');
    if (!table.streakDay) {
      await queryInterface.addColumn('daily_claims', 'streakDay', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
    }
    if (!table.drawEntries) {
      await queryInterface.addColumn('daily_claims', 'drawEntries', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('daily_claims');
    if (table.drawEntries) await queryInterface.removeColumn('daily_claims', 'drawEntries');
    if (table.streakDay) await queryInterface.removeColumn('daily_claims', 'streakDay');
  },
};