export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PartnerEarnings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      partnerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Partners',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      referralId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'PartnerReferrals',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      claimDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      cycleNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Which 30-day cycle this earning belongs to (0, 1, 2...)'
      },
      amount: {
        type: Sequelize.DECIMAL(30, 0),
        allowNull: false,
        defaultValue: '100000000000'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'reversed'),
        defaultValue: 'pending'
      },
      transactionHash: {
        type: Sequelize.STRING,
        allowNull: true
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

    // Add indexes for faster lookups
    await queryInterface.addIndex('PartnerEarnings', ['partnerId']);
    await queryInterface.addIndex('PartnerEarnings', ['userId']);
    await queryInterface.addIndex('PartnerEarnings', ['referralId']);
    await queryInterface.addIndex('PartnerEarnings', ['status']);
    await queryInterface.addIndex('PartnerEarnings', ['claimDate']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PartnerEarnings');
  }
};
