export async function up(queryInterface) {
  await queryInterface.dropTable('twitter_campaigns');

  // Clean up leftover enum type created for twitter campaign taskType in Postgres.
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_twitter_campaigns_taskType";');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.createTable('twitter_campaigns', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    taskType: {
      type: Sequelize.ENUM('retweet', 'comment', 'poll'),
      allowNull: false,
      defaultValue: 'retweet',
    },
    tweetUrl: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    rewardAmount: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '100000',
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    expiresAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
    },
  });
}
