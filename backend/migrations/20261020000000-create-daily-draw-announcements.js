export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('daily_draw_announcements', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        drawId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'daily_draws', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
        attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        postId: { type: Sequelize.STRING, allowNull: true },
        publishedAt: { type: Sequelize.DATE, allowNull: true },
        nextAttemptAt: { type: Sequelize.DATE, allowNull: true },
        errorCode: { type: Sequelize.STRING, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      }, { transaction });
      await queryInterface.addIndex('daily_draw_announcements', ['status', 'nextAttemptAt'], {
        name: 'daily_draw_announcements_retry_idx', transaction,
      });
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('daily_draw_announcements');
  },
};
