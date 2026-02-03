export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'twitterId', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'advertiser', 'admin'),
      defaultValue: 'user'
    });
    await queryInterface.addColumn('users', 'totalEarned', {
      type: Sequelize.DECIMAL(30, 0),
      defaultValue: 0
    });
    await queryInterface.addColumn('users', 'tasksCompleted', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('users', 'reputationScore', {
      type: Sequelize.INTEGER,
      defaultValue: 100
    });
    await queryInterface.addColumn('users', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('users', 'lastLogin', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'telegramVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
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
