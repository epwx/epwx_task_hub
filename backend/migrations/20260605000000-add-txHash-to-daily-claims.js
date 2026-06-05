export default {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('daily_claims');

    if (!table.txHash) {
      await queryInterface.addColumn('daily_claims', 'txHash', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('daily_claims');

    if (table.txHash) {
      await queryInterface.removeColumn('daily_claims', 'txHash');
    }
  },
};