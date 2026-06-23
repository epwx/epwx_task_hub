export default {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('Partners');

    if (!tableDesc.status) {
      await queryInterface.addColumn('Partners', 'status', {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      });
    }

    if (!tableDesc.verificationImagePath) {
      await queryInterface.addColumn('Partners', 'verificationImagePath', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!tableDesc.rejectionReason) {
      await queryInterface.addColumn('Partners', 'rejectionReason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableDesc.approvedAt) {
      await queryInterface.addColumn('Partners', 'approvedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDesc.approvedBy) {
      await queryInterface.addColumn('Partners', 'approvedBy', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Add index only if not already present (safe to attempt, Sequelize handles duplicates)
    try {
      await queryInterface.addIndex('Partners', ['status'], { name: 'partners_status_idx' });
    } catch (e) {
      // Index may already exist, ignore
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Partners', 'verificationImagePath');
    await queryInterface.removeColumn('Partners', 'rejectionReason');
    await queryInterface.removeColumn('Partners', 'approvedAt');
    await queryInterface.removeColumn('Partners', 'approvedBy');
  }
};
