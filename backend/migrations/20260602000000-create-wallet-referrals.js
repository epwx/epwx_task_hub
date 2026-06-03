export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wallet_referrals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      referrerWallet: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      referredWallet: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      registrationIp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      claimIp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rewardAmount: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '1000000',
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      referrerRewardStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      referredRewardStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      referrerRewardTxHash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referredRewardTxHash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      disqualificationReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      qualifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rewardedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      referredFirstClaimId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      referredFirstClaimedAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('wallet_referrals', ['referrerWallet'], {
      name: 'wallet_referrals_referrer_wallet_idx',
    });
    await queryInterface.addIndex('wallet_referrals', ['referredWallet'], {
      name: 'wallet_referrals_referred_wallet_idx',
      unique: true,
    });
    await queryInterface.addIndex('wallet_referrals', ['status'], {
      name: 'wallet_referrals_status_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('wallet_referrals');
  },
};