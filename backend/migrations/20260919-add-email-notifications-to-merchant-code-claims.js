export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('claims', 'customerEmail', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('claims', 'emailNotificationConsent', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await queryInterface.addColumn('claims', 'lastEmailNotificationStatus', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('claims', 'lastEmailNotificationStatus');
  await queryInterface.removeColumn('claims', 'emailNotificationConsent');
  await queryInterface.removeColumn('claims', 'customerEmail');
}