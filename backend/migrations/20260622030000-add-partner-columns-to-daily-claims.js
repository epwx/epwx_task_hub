export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('daily_claims', 'partnerReferralId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'PartnerReferrals',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('daily_claims', 'partnerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Partners',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('daily_claims', ['partnerReferralId']);
    await queryInterface.addIndex('daily_claims', ['partnerId']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('daily_claims', 'partnerReferralId');
    await queryInterface.removeColumn('daily_claims', 'partnerId');
  }
};
