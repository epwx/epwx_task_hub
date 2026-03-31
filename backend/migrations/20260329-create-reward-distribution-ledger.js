export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("RewardDistributionLedger", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      merchant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      merchant_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receipt_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      epwx_amount: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
      },
      fiat_value: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
      },
      transaction_hash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("RewardDistributionLedger");
  },
};
