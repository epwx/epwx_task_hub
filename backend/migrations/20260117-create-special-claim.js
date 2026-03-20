export default {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.special_claims') as exists;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!tableExists[0].exists) {
      await queryInterface.createTable('special_claims', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        wallet: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        claimedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('pending', 'claimed', 'expired'),
          defaultValue: 'pending',
        },
      });
    }
    // Add indexes if not exist
    const indexes = await queryInterface.showIndex('special_claims');
    const indexNames = indexes.map(idx => idx.name);
    if (!indexNames.includes('special_claims_wallet')) {
      await queryInterface.addIndex('special_claims', ['wallet']);
    }
    if (!indexNames.includes('special_claims_status')) {
      await queryInterface.addIndex('special_claims', ['status']);
    }
    if (!indexNames.includes('special_claims_createdAt')) {
      await queryInterface.addIndex('special_claims', ['createdAt']);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('special_claims');
  },
};
