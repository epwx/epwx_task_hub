export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("claims", "ip", {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "0.0.0.0",
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("claims", "ip");
}
