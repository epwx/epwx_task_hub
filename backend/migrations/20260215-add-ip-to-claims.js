"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("claims", "ip", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "0.0.0.0"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("claims", "ip");
  },
};
