export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('platform_stats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      statsKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      totalClaimsTillNow: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: '0',
      },
      totalEpwxDistributedTillNow: {
        type: Sequelize.DECIMAL(36, 0),
        allowNull: false,
        defaultValue: '0',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('platform_stats');
  },
};