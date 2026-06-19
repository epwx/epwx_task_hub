export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('daily_draws', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      drawDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
      },
      winnerCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      eligibleCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      prizeAmount: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '100000',
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'completed',
      },
      runBy: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      runAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
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

    await queryInterface.createTable('daily_draw_winners', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      drawId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'daily_draws',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      dailyClaimId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'daily_claims',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      wallet: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      prizeAmount: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      txHash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      paidAt: {
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

    await queryInterface.addIndex('daily_draw_winners', ['drawId', 'wallet'], {
      unique: true,
      name: 'daily_draw_winners_draw_wallet_uq',
    });

    await queryInterface.addIndex('daily_draw_winners', ['drawId', 'rank'], {
      unique: true,
      name: 'daily_draw_winners_draw_rank_uq',
    });

    await queryInterface.addIndex('daily_draw_winners', ['status'], {
      name: 'daily_draw_winners_status_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('daily_draw_winners', 'daily_draw_winners_status_idx');
    await queryInterface.removeIndex('daily_draw_winners', 'daily_draw_winners_draw_rank_uq');
    await queryInterface.removeIndex('daily_draw_winners', 'daily_draw_winners_draw_wallet_uq');
    await queryInterface.dropTable('daily_draw_winners');
    await queryInterface.dropTable('daily_draws');
  },
};
