"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("cashback_claims", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      wallet: { type: Sequelize.STRING, allowNull: false },
      txHash: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.STRING, allowNull: false },
      cashbackAmount: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.ENUM("pending", "paid"), defaultValue: "pending" },
      claimedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("cashback_claims");
  }
};
