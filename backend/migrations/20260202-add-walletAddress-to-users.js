export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'walletAddress', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/
      },
      defaultValue: ''
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'walletAddress');
  }
};
