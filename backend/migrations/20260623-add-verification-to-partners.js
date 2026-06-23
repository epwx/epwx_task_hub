export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Partners', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    });

    await queryInterface.addColumn('Partners', 'verificationImagePath', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Path to Twitter followers screenshot'
    });

    await queryInterface.addColumn('Partners', 'rejectionReason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Reason for rejection if rejected'
    });

    await queryInterface.addColumn('Partners', 'approvedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Partners', 'approvedBy', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Admin wallet address who approved'
    });

    await queryInterface.addIndex('Partners', ['status']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Partners', 'status');
    await queryInterface.removeColumn('Partners', 'verificationImagePath');
    await queryInterface.removeColumn('Partners', 'rejectionReason');
    await queryInterface.removeColumn('Partners', 'approvedAt');
    await queryInterface.removeColumn('Partners', 'approvedBy');
  }
};
