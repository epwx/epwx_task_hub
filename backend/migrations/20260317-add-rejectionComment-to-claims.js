
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("claims", "rejectionComment", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("claims", "rejectionComment");
}
