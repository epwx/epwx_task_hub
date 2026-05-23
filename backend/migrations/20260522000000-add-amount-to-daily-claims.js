export default {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('daily_claims');

    if (!table.amount) {
      await queryInterface.addColumn('daily_claims', 'amount', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '100000',
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('daily_claims');

    if (table.amount) {
      await queryInterface.removeColumn('daily_claims', 'amount');
    }
  },
};