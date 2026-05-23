export default {
  up: async (queryInterface) => {
    await queryInterface.addIndex('daily_claims', ['claimedAt'], {
      name: 'daily_claims_claimed_at_idx',
    });

    await queryInterface.addIndex('daily_claims', ['status', 'claimedAt'], {
      name: 'daily_claims_status_claimed_at_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('daily_claims', 'daily_claims_status_claimed_at_idx');
    await queryInterface.removeIndex('daily_claims', 'daily_claims_claimed_at_idx');
  },
};