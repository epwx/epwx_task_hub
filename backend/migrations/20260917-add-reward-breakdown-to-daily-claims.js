export default {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('daily_claims');
    const columns = {
      baseAmount: { type: Sequelize.STRING, allowNull: true },
      telegramMember: { type: Sequelize.BOOLEAN, allowNull: true },
      emailVerified: { type: Sequelize.BOOLEAN, allowNull: true },
      emailBonusAmount: { type: Sequelize.STRING, allowNull: true },
      emailBonusBps: { type: Sequelize.INTEGER, allowNull: true },
    };

    for (const [columnName, definition] of Object.entries(columns)) {
      if (!table[columnName]) {
        await queryInterface.addColumn('daily_claims', columnName, definition);
      }
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('daily_claims');
    for (const columnName of ['emailBonusBps', 'emailBonusAmount', 'emailVerified', 'telegramMember', 'baseAmount']) {
      if (table[columnName]) {
        await queryInterface.removeColumn('daily_claims', columnName);
      }
    }
  },
};