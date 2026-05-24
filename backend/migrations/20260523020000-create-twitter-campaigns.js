export async function up(queryInterface, Sequelize) {
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

  await queryInterface.addColumn('claims', 'twitterCampaignId', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('claims', 'twitterCampaignId');
  await queryInterface.dropTable('twitter_campaigns');
}