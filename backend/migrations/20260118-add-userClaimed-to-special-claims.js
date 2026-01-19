export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('special_claims', 'userClaimed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('special_claims', 'userClaimed');
  },
};
