const sequelize = require('../src/config/database');

async function migrate() {
  try {
    console.log('Running migration: Make campaignId nullable in task_submissions...');
    
    await sequelize.query(
      'ALTER TABLE task_submissions ALTER COLUMN "campaignId" DROP NOT NULL;'
    );
    
    console.log('✅ Migration successful! campaignId is now nullable.');
    
    // Verify the change
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'task_submissions' 
      AND column_name = 'campaignId';
    `);
    
    console.log('Verification:', results[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
