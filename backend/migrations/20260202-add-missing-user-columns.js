export default {
  up: async (queryInterface, Sequelize) => {
    // twitterId already exists, skipping addColumn
    // role already exists, skipping addColumn
    // totalEarned already exists, skipping addColumn
    // tasksCompleted already exists, skipping addColumn
    // reputationScore already exists, skipping addColumn
    // isActive already exists, skipping addColumn
    // lastLogin already exists, skipping addColumn
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'twitterId');
    await queryInterface.removeColumn('users', 'role');
    await queryInterface.removeColumn('users', 'totalEarned');
    await queryInterface.removeColumn('users', 'tasksCompleted');
    await queryInterface.removeColumn('users', 'reputationScore');
    await queryInterface.removeColumn('users', 'isActive');
    await queryInterface.removeColumn('users', 'lastLogin');
    await queryInterface.removeColumn('users', 'telegramVerified');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_users_role\";");
  }
};
