"use strict";

export default {
  up: async (queryInterface, Sequelize) => {
    // Remove unique constraint if it exists
    try {
      await queryInterface.removeConstraint('merchants', 'merchants_wallet_key');
    } catch (e) {}
    // Alter wallet column to allow null
    await queryInterface.changeColumn('merchants', 'wallet', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Revert wallet column to NOT NULL and unique
    await queryInterface.changeColumn('merchants', 'wallet', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  }
};
