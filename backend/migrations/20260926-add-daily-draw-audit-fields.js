export default {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('daily_draws');
    const columns = {
      selectionAlgorithm: { type: Sequelize.STRING, allowNull: true },
      eligiblePoolHash: { type: Sequelize.STRING, allowNull: true },
      entropyBlockNumber: { type: Sequelize.STRING, allowNull: true },
      entropyBlockHash: { type: Sequelize.STRING, allowNull: true },
    };

    for (const [columnName, definition] of Object.entries(columns)) {
      if (!table[columnName]) {
        await queryInterface.addColumn('daily_draws', columnName, definition);
      }
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('daily_draws');
    for (const columnName of ['entropyBlockHash', 'entropyBlockNumber', 'eligiblePoolHash', 'selectionAlgorithm']) {
      if (table[columnName]) {
        await queryInterface.removeColumn('daily_draws', columnName);
      }
    }
  },
};