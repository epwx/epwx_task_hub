export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("daily_claims", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      wallet: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      claimedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
    });
    // Indexes already exist, skip to avoid duplicate error
    // await queryInterface.addIndex("daily_claims", ["wallet"]);
    // await queryInterface.addIndex("daily_claims", ["ip"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("daily_claims");
  },
};
