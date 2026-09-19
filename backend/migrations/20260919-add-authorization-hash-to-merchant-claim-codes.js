export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('merchant_claim_codes', 'authorizationHash', {
    type: Sequelize.STRING(64),
    allowNull: true,
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('merchant_claim_codes', 'authorizationHash');
}