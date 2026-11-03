export async function up(queryInterface, Sequelize) {
  const claims = await queryInterface.describeTable('claims');
  const columns = {
    verificationStatus: { type: Sequelize.STRING, allowNull: true },
    verificationDecision: { type: Sequelize.STRING, allowNull: true },
    verificationConfidence: { type: Sequelize.DECIMAL(5, 4), allowNull: true },
    verificationCompletedAt: { type: Sequelize.DATE, allowNull: true },
    verificationLeaseUntil: { type: Sequelize.DATE, allowNull: true },
    verificationNextAttemptAt: { type: Sequelize.DATE, allowNull: true },
    verificationAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    approvedAt: { type: Sequelize.DATE, allowNull: true },
    approvedBy: { type: Sequelize.STRING, allowNull: true },
    paidAt: { type: Sequelize.DATE, allowNull: true },
    txHash: { type: Sequelize.STRING, allowNull: true },
    payoutStatus: { type: Sequelize.STRING, allowNull: true },
    payoutLeaseUntil: { type: Sequelize.DATE, allowNull: true },
    payoutLastError: { type: Sequelize.STRING, allowNull: true },
    proofSha256: { type: Sequelize.STRING(64), allowNull: true },
    proofPerceptualHash: { type: Sequelize.STRING(16), allowNull: true },
  };

  for (const [name, definition] of Object.entries(columns)) {
    if (!claims[name]) {
      await queryInterface.addColumn('claims', name, definition);
    }
  }

  await queryInterface.addIndex('claims', ['verificationStatus', 'verificationNextAttemptAt', 'verificationLeaseUntil'], {
    name: 'claims_verification_queue_idx',
  }).catch((error) => {
    if (!String(error?.message || '').includes('already exists')) throw error;
  });
  await queryInterface.addIndex('claims', ['status', 'payoutStatus', 'payoutLeaseUntil'], {
    name: 'claims_social_payout_queue_idx',
  }).catch((error) => {
    if (!String(error?.message || '').includes('already exists')) throw error;
  });
  await queryInterface.addIndex('claims', ['proofSha256'], {
    name: 'claims_proof_sha256_idx',
  }).catch((error) => {
    if (!String(error?.message || '').includes('already exists')) throw error;
  });
  await queryInterface.addIndex('claims', ['proofPerceptualHash'], {
    name: 'claims_proof_perceptual_hash_idx',
  }).catch((error) => {
    if (!String(error?.message || '').includes('already exists')) throw error;
  });

  await queryInterface.createTable('social_claim_verification_attempts', {
    id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
    claimId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'claims', key: 'id' },
      onDelete: 'CASCADE',
    },
    attemptNumber: { type: Sequelize.INTEGER, allowNull: false },
    status: { type: Sequelize.STRING, allowNull: false },
    provider: { type: Sequelize.STRING, allowNull: true },
    model: { type: Sequelize.STRING, allowNull: true },
    rubricVersion: { type: Sequelize.STRING, allowNull: false },
    decision: { type: Sequelize.STRING, allowNull: true },
    confidence: { type: Sequelize.DECIMAL(5, 4), allowNull: true },
    signals: { type: Sequelize.JSONB, allowNull: true },
    reasonCodes: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
    errorCode: { type: Sequelize.STRING, allowNull: true },
    startedAt: { type: Sequelize.DATE, allowNull: false },
    completedAt: { type: Sequelize.DATE, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });
  await queryInterface.addConstraint('social_claim_verification_attempts', {
    fields: ['claimId', 'attemptNumber'],
    type: 'unique',
    name: 'social_claim_verification_attempt_unique',
  });

  await queryInterface.createTable('social_claim_decision_audits', {
    id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
    claimId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'claims', key: 'id' },
      onDelete: 'CASCADE',
    },
    actor: { type: Sequelize.STRING, allowNull: false },
    previousDecision: { type: Sequelize.STRING, allowNull: true },
    nextDecision: { type: Sequelize.STRING, allowNull: false },
    reason: { type: Sequelize.TEXT, allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('social_claim_decision_audits');
  await queryInterface.dropTable('social_claim_verification_attempts');
  await queryInterface.removeIndex('claims', 'claims_proof_perceptual_hash_idx');
  await queryInterface.removeIndex('claims', 'claims_proof_sha256_idx');
  await queryInterface.removeIndex('claims', 'claims_social_payout_queue_idx');
  await queryInterface.removeIndex('claims', 'claims_verification_queue_idx');

  for (const name of [
    'proofPerceptualHash',
    'proofSha256',
    'payoutLastError',
    'payoutLeaseUntil',
    'payoutStatus',
    'txHash',
    'paidAt',
    'approvedBy',
    'approvedAt',
    'verificationAttempts',
    'verificationNextAttemptAt',
    'verificationLeaseUntil',
    'verificationCompletedAt',
    'verificationConfidence',
    'verificationDecision',
    'verificationStatus',
  ]) {
    await queryInterface.removeColumn('claims', name);
  }
}
