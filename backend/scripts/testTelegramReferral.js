// Automated test script for Telegram referral system
// Run: node backend/scripts/testTelegramReferral.js
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api/epwx'; // Change if needed
const referrerWallet = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
const referredWallet = '0xFEDCBA9876543210FEDCBA9876543210FEDCBA98';
const telegramUserId = '999999999'; // Simulated Telegram user ID

async function run() {
  try {
    // 1. Simulate referral join
    console.log('Simulating referral join...');
    let res = await axios.post(`${API_BASE}/telegram-referral`, {
      referrerWallet,
      telegramUserId
    });
    console.log('Referral join response:', res.data);

    // 2. Simulate referred user Telegram verification
    console.log('Simulating referred user Telegram verification...');
    res = await axios.post(`${API_BASE}/telegram-verify`, {
      wallet: referredWallet
    });
    console.log('Telegram verify response:', res.data);

    // 3. Check referral stats for referrer
    console.log('Checking referral stats for referrer...');
    res = await axios.get(`${API_BASE}/telegram-referral-stats?wallet=${referrerWallet}`);
    console.log('Referral stats:', res.data);

    // 4. Fetch pending referral rewards (admin)
    const admin = '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735';
    console.log('Fetching pending referral rewards (admin)...');
    res = await axios.get(`${API_BASE}/telegram-referral-rewards?admin=${admin}&status=pending`);
    console.log('Pending referral rewards:', res.data.rewards);

    // 5. Mark referrer and referred as paid (admin)
    if (res.data.rewards && res.data.rewards.length > 0) {
      const referralId = res.data.rewards[0].id;
      console.log('Marking referrer as paid...');
      await axios.post(`${API_BASE}/telegram-referral-reward/mark-paid`, {
        admin,
        referralId,
        referrer: true,
        referred: false
      });
      console.log('Marking referred as paid...');
      await axios.post(`${API_BASE}/telegram-referral-reward/mark-paid`, {
        admin,
        referralId,
        referrer: false,
        referred: true
      });
      console.log('Marked both as paid.');
    }

    // 6. Fetch paid referral rewards (admin)
    res = await axios.get(`${API_BASE}/telegram-referral-rewards?admin=${admin}&status=paid`);
    console.log('Paid referral rewards:', res.data.rewards);

    console.log('Test completed successfully.');
  } catch (err) {
    console.error('Test failed:', err?.response?.data || err);
  }
}

run();
