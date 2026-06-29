export default {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    const normalizedTables = tables.map((table) => String(table).toLowerCase());

    if (!normalizedTables.includes('telegram_group_owners')) {
      await queryInterface.createTable('telegram_group_owners', {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },
        groupId: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        groupTitle: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        ownerTelegramUserId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        ownerWallet: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive'),
          allowNull: false,
          defaultValue: 'active',
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()'),
        },
      });

      await queryInterface.addIndex('telegram_group_owners', ['groupId'], { unique: true, name: 'telegram_group_owners_group_id_idx' });
      await queryInterface.addIndex('telegram_group_owners', ['ownerWallet'], { name: 'telegram_group_owners_owner_wallet_idx' });
      await queryInterface.addIndex('telegram_group_owners', ['ownerTelegramUserId'], { name: 'telegram_group_owners_owner_telegram_idx' });
      await queryInterface.addIndex('telegram_group_owners', ['status'], { name: 'telegram_group_owners_status_idx' });
    }

    if (!normalizedTables.includes('telegram_group_rewards')) {
      await queryInterface.createTable('telegram_group_rewards', {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },
        groupOwnerId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'telegram_group_owners',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        groupId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        ownerWallet: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        claimantWallet: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        claimantTelegramUserId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        dailyClaimId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: {
            model: 'daily_claims',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        rewardAmount: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '10000',
        },
        status: {
          type: Sequelize.ENUM('pending', 'paid', 'blocked'),
          allowNull: false,
          defaultValue: 'pending',
        },
        reason: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()'),
        },
      });

      await queryInterface.addIndex('telegram_group_rewards', ['groupOwnerId'], { name: 'telegram_group_rewards_owner_id_idx' });
      await queryInterface.addIndex('telegram_group_rewards', ['groupId'], { name: 'telegram_group_rewards_group_id_idx' });
      await queryInterface.addIndex('telegram_group_rewards', ['ownerWallet'], { name: 'telegram_group_rewards_owner_wallet_idx' });
      await queryInterface.addIndex('telegram_group_rewards', ['status'], { name: 'telegram_group_rewards_status_idx' });
      await queryInterface.addIndex('telegram_group_rewards', ['claimantTelegramUserId'], { name: 'telegram_group_rewards_claimant_tg_idx' });
      await queryInterface.addIndex('telegram_group_rewards', ['dailyClaimId'], { unique: true, name: 'telegram_group_rewards_daily_claim_id_idx' });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    const normalizedTables = tables.map((table) => String(table).toLowerCase());

    if (normalizedTables.includes('telegram_group_rewards')) {
      await queryInterface.dropTable('telegram_group_rewards');
    }

    if (normalizedTables.includes('telegram_group_owners')) {
      await queryInterface.dropTable('telegram_group_owners');
    }

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_telegram_group_rewards_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_telegram_group_owners_status";');
  },
};
