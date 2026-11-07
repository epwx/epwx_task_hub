export default {
  async up(queryInterface, Sequelize) {
    const userColumns = await queryInterface.describeTable('users');
    if (!userColumns.twitterUsername) {
      await queryInterface.addColumn('users', 'twitterUsername', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!userColumns.twitterAccessToken) {
      await queryInterface.addColumn('users', 'twitterAccessToken', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!userColumns.twitterRefreshToken) {
      await queryInterface.addColumn('users', 'twitterRefreshToken', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    await queryInterface.createTable('security_authorizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      authorizationHash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      walletAddress: {
        type: Sequelize.STRING(42),
        allowNull: false,
      },
      purpose: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    await queryInterface.addIndex('security_authorizations', ['walletAddress']);
    await queryInterface.addIndex('security_authorizations', ['purpose']);
    await queryInterface.addIndex('security_authorizations', ['expiresAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('security_authorizations');
  },
};
