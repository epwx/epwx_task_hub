export default {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('Partners');

    if (!tableDesc.status) {
      await queryInterface.addColumn('Partners', 'status', {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      });
    } else {
      // Backward compatibility: older schema used active/inactive/suspended values.
      // Ensure verification workflow values exist, map old values, and update default.
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM pg_type t
            WHERE t.typname = 'enum_Partners_status'
          ) THEN
            ALTER TYPE "enum_Partners_status" ADD VALUE IF NOT EXISTS 'pending';
            ALTER TYPE "enum_Partners_status" ADD VALUE IF NOT EXISTS 'approved';
            ALTER TYPE "enum_Partners_status" ADD VALUE IF NOT EXISTS 'rejected';
          END IF;
        END
        $$;
      `);

      await queryInterface.sequelize.query(`
        UPDATE "Partners"
        SET "status" = CASE
          WHEN "status" = 'active' THEN 'approved'
          WHEN "status" IN ('inactive', 'suspended') THEN 'rejected'
          ELSE "status"
        END;
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE "Partners"
        ALTER COLUMN "status" SET DEFAULT 'pending';
      `);
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
