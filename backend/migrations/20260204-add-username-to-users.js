export default {
  up: async (queryInterface, Sequelize) => {
    // Only add the column if it does not already exist
    const table = await queryInterface.describeTable('users');
    if (!table.username) {
      await queryInterface.addColumn('users', 'username', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        defaultValue: '' // Set to empty string or a placeholder if needed
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Only remove the column if it exists
    const table = await queryInterface.describeTable('users');
    if (table.username) {
      await queryInterface.removeColumn('users', 'username');
    }
  }
};
