export default {
  up: async (queryInterface, Sequelize) => {
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
    await queryInterface.addIndex('special_claims', ['wallet']);
    await queryInterface.addIndex('special_claims', ['status']);
    await queryInterface.addIndex('special_claims', ['createdAt']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('special_claims');
  },
};
