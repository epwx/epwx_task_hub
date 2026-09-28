export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('daily_claim_email_preferences', 'pendingSuccessClaimId', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('daily_claim_email_preferences', 'pendingSuccessClaimId');
}