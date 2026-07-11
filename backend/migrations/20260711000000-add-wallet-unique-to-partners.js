export default {
  up: async (queryInterface, Sequelize) => {
    // Add unique constraint on walletAddress if it doesn't exist
    try {
      const table = await queryInterface.describeTable('Partners');
      
      // Check if walletAddress already has unique constraint
      const indexes = await queryInterface.sequelize.query(
        `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Partners'`
      );
      
      const hasUniqueWallet = indexes[0]?.some(idx => 
        idx.indexdef?.includes('walletAddress') && idx.indexdef?.includes('UNIQUE')
      );
      
      if (!hasUniqueWallet && table.walletAddress) {
        await queryInterface.addConstraint('Partners', {
          fields: ['walletAddress'],
          type: 'unique',
          name: 'partners_wallet_unique'
        });
        console.log('Added unique constraint on Partners.walletAddress');
      }
    } catch (error) {
      // If constraint already exists, continue
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        console.log('Unique constraint on walletAddress already exists');
      } else {
        throw error;
      }
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeConstraint('Partners', 'partners_wallet_unique');
    } catch (error) {
      // Constraint may not exist, continue
      console.log('Unique constraint not found, skipping removal');
    }
  }
};
