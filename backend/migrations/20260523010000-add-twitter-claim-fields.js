export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('claims', 'merchantId', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });

  await queryInterface.changeColumn('claims', 'lat', {
    type: Sequelize.FLOAT,
    allowNull: true,
  });

  await queryInterface.changeColumn('claims', 'lng', {
    type: Sequelize.FLOAT,
    allowNull: true,
  });

  await queryInterface.addColumn('claims', 'claimType', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'merchant',
  });

  await queryInterface.addColumn('claims', 'campaignCode', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn('claims', 'twitterUsername', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('claims', 'twitterUsername');
  await queryInterface.removeColumn('claims', 'campaignCode');
  await queryInterface.removeColumn('claims', 'claimType');

  await queryInterface.changeColumn('claims', 'lng', {
    type: Sequelize.FLOAT,
    allowNull: false,
  });

  await queryInterface.changeColumn('claims', 'lat', {
    type: Sequelize.FLOAT,
    allowNull: false,
  });

  await queryInterface.changeColumn('claims', 'merchantId', {
    type: Sequelize.INTEGER,
    allowNull: false,
  });
}