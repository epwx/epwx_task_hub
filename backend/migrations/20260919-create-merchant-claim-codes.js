export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('merchant_claim_codes', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    merchantId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'merchants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    codeHash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
    codeLastFour: { type: Sequelize.STRING(4), allowNull: false },
    rewardAmount: { type: Sequelize.STRING, allowNull: false },
    status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
    expiresAt: { type: Sequelize.DATE, allowNull: false },
    redeemedAt: { type: Sequelize.DATE, allowNull: true },
    redeemedBy: { type: Sequelize.STRING, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  });

  await queryInterface.addIndex('merchant_claim_codes', ['merchantId', 'status']);
  await queryInterface.addColumn('claims', 'merchantClaimCodeId', {
    type: Sequelize.INTEGER,
    allowNull: true,
    unique: true,
    references: { model: 'merchant_claim_codes', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('claims', 'merchantClaimCodeId');
  await queryInterface.dropTable('merchant_claim_codes');
}