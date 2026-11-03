export async function up(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable('RewardDistributionLedger');

  await queryInterface.changeColumn('RewardDistributionLedger', 'merchant_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
  await queryInterface.changeColumn('RewardDistributionLedger', 'merchant_name', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  if (!table.source_type) {
    await queryInterface.addColumn('RewardDistributionLedger', 'source_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
  if (!table.source_id) {
    await queryInterface.addColumn('RewardDistributionLedger', 'source_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }

  await queryInterface.addIndex('RewardDistributionLedger', ['source_type', 'source_id'], {
    unique: true,
    name: 'reward_ledger_source_unique',
  }).catch((error) => {
    if (!String(error?.message || '').includes('already exists')) throw error;
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('RewardDistributionLedger', 'reward_ledger_source_unique');
  await queryInterface.sequelize.query(
    'DELETE FROM "RewardDistributionLedger" WHERE "merchant_id" IS NULL'
  );
  await queryInterface.removeColumn('RewardDistributionLedger', 'source_id');
  await queryInterface.removeColumn('RewardDistributionLedger', 'source_type');
  await queryInterface.changeColumn('RewardDistributionLedger', 'merchant_name', {
    type: Sequelize.STRING,
    allowNull: false,
  });
  await queryInterface.changeColumn('RewardDistributionLedger', 'merchant_id', {
    type: Sequelize.INTEGER,
    allowNull: false,
  });
}
