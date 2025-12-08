#!/usr/bin/env node

// Load environment variables first
require('dotenv').config();

const sequelize = require('../src/config/database');
const { User, Campaign, TaskSubmission } = require('../src/models');

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database schema...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');
    
    // Verify tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📋 Created tables:');
    results.forEach(row => console.log(`  - ${row.table_name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    process.exit(1);
  }
}

syncDatabase();
