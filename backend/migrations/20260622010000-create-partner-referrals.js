export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PartnerReferrals', {
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
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      referralLink: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      referralCode: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      firstClaimDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastClaimDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      totalClaimsEarned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalPartnerEarnings: {
        type: Sequelize.DECIMAL(30, 0),
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

    // Add index for faster lookups
    await queryInterface.addIndex('PartnerReferrals', ['partnerId']);
    await queryInterface.addIndex('PartnerReferrals', ['userId']);
    await queryInterface.addIndex('PartnerReferrals', ['referralCode']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PartnerReferrals');
  }
};
