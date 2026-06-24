export default {
  up: async (queryInterface) => {
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
  },

  down: async () => {
    // Irreversible migration: enum values cannot be safely removed in-place.
  }
};
