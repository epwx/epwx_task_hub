export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    `ALTER TYPE "enum_twitter_campaigns_taskType" ADD VALUE IF NOT EXISTS 'poll';`
  );
}

export async function down() {
  // PostgreSQL does not support removing enum values safely in-place.
}