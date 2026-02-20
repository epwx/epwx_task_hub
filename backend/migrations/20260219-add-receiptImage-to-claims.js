"use strict";

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('claims', 'receiptImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('claims', 'receiptImage');
  }
};
