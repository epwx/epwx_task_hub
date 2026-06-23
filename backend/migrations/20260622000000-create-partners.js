export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Partners', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      walletAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          is: /^0x[a-fA-F0-9]{40}$/
        }
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      telegramChannel: {
        type: Sequelize.STRING,
        allowNull: true
      },
      xProfile: {
        type: Sequelize.STRING,
        allowNull: true
      },
      totalEarnings: {
        type: Sequelize.DECIMAL(30, 0),
        defaultValue: 0
      },
      totalReferredUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Partners');
  }
};
