export default {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('daily_claims');
    const columns = {
      eligibilityPolicyVersion: { type: Sequelize.STRING, allowNull: true },
      eligibilityConfirmedAt: { type: Sequelize.DATE, allowNull: true },
      eligibilityCountryCode: { type: Sequelize.STRING(2), allowNull: true },
    };

    for (const [columnName, definition] of Object.entries(columns)) {
      if (!table[columnName]) {
        await queryInterface.addColumn('daily_claims', columnName, definition);
      }
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('daily_claims');
    for (const columnName of ['eligibilityCountryCode', 'eligibilityConfirmedAt', 'eligibilityPolicyVersion']) {
      if (table[columnName]) {
        await queryInterface.removeColumn('daily_claims', columnName);
      }
    }
  },
};