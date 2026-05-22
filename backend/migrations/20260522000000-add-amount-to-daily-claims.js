export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('daily_claims', 'amount', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '100000',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('daily_claims', 'amount');
  },
};