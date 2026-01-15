import dotenv from 'dotenv';
dotenv.config();
// Simple Node.js Telegram bot for group membership verification
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '<YOUR_BOT_TOKEN_HERE>';
console.log('BOT_TOKEN:', BOT_TOKEN); // Debug: print the bot token
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-1001970739822'; // Replace with your group ID
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Store wallet verification requests in memory (use DB for production)
const walletRequests = {};

bot.onText(/\/start (.+)/, async (msg, match) => {
  const wallet = match[1];
  const userId = msg.from.id;
  walletRequests[userId] = wallet;
  bot.sendMessage(msg.chat.id, `Hi! To verify your Telegram membership, please reply with /verify.`);
});

bot.onText(/\/verify/, async (msg) => {
  const userId = msg.from.id;
  const wallet = walletRequests[userId];
  if (!wallet) {
    bot.sendMessage(msg.chat.id, 'No wallet address found. Please use the verification link from the dApp.');
    return;
  }
  // Check group membership
  try {
    const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_ID}&user_id=${userId}`);
    const status = res.data.result.status;
    if (['member', 'administrator', 'creator'].includes(status)) {
      bot.sendMessage(msg.chat.id, `✅ Verified! You are a member of the EPWX group. Your wallet: ${wallet}`);
      // TODO: Notify your backend/dApp of successful verification (e.g., via API call)
    } else {
      bot.sendMessage(msg.chat.id, '❌ You are not a member of the EPWX group. Please join and try again.');
    }
  } catch (err) {
    bot.sendMessage(msg.chat.id, 'Error verifying membership. Please try again later.');
  }
});

console.log('Telegram bot running...');
