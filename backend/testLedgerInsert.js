
import dotenv from 'dotenv';
dotenv.config();
console.log('[ENV]', {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
});

import sequelize from './src/config/database.js'; // DB_USER is used only from env, no fallback
import { DataTypes } from 'sequelize';
import RewardDistributionLedgerDef from './src/models/RewardDistributionLedger.js';

const RewardDistributionLedger = RewardDistributionLedgerDef(sequelize, DataTypes);

async function testInsertAndSelect() {
  try {
    await sequelize.authenticate();
    console.log('DB connection OK');
    // Insert a test row
    const entry = await RewardDistributionLedger.create({
      date: new Date(),
      merchant_id: 999,
      merchant_name: 'SequelizeTest',
      customer_id: 'test_customer',
      receipt_id: 'sequelize_test',
      epwx_amount: 42.42,
      fiat_value: 10.00,
      transaction_hash: '0xseqtest',
      notes: 'Inserted by testLedgerInsert.js',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Inserted entry:', entry.toJSON());
    // Select all rows
    const allRows = await RewardDistributionLedger.findAll();
    console.log('All rows in RewardDistributionLedger:');
    allRows.forEach(row => console.log(row.toJSON()));
    await sequelize.close();
  } catch (err) {
    console.error('Error in testInsertAndSelect:', err);
    process.exit(1);
  }
}

testInsertAndSelect();
