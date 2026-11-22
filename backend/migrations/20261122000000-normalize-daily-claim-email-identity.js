export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('daily_claim_email_preferences', 'emailNormalized', {
    type: Sequelize.STRING(254),
    allowNull: true,
  });

  await queryInterface.sequelize.query(`
    UPDATE daily_claim_email_preferences
    SET "emailNormalized" = LOWER(TRIM(email))
  `);

  await queryInterface.changeColumn('daily_claim_email_preferences', 'emailNormalized', {
    type: Sequelize.STRING(254),
    allowNull: false,
  });

  await queryInterface.addIndex('daily_claim_email_preferences', ['emailNormalized'], {
    name: 'daily_claim_email_preferences_email_normalized_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex(
    'daily_claim_email_preferences',
    'daily_claim_email_preferences_email_normalized_idx',
  );
  await queryInterface.removeColumn('daily_claim_email_preferences', 'emailNormalized');
}
