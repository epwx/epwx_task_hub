export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('daily_claim_email_preferences', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    wallet: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    emailVerifiedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    verificationTokenHash: {
      type: Sequelize.STRING(64),
      allowNull: true,
      unique: true,
    },
    verificationExpiresAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    unsubscribeTokenHash: {
      type: Sequelize.STRING(64),
      allowNull: false,
      unique: true,
    },
    remindersEnabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    successEmailsEnabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    timezone: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'UTC',
    },
    unsubscribedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    lastSuccessClaimId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    lastReminderClaimId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    },
  });

}

export async function down(queryInterface) {
  await queryInterface.dropTable('daily_claim_email_preferences');
}