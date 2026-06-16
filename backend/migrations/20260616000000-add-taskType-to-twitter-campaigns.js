export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('twitter_campaigns', 'taskType', {
    type: Sequelize.ENUM('retweet', 'comment'),
    allowNull: false,
    defaultValue: 'retweet',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('twitter_campaigns', 'taskType');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_twitter_campaigns_taskType";');
}