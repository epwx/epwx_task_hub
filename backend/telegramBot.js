
import dotenv from 'dotenv';
dotenv.config();
console.log('CWD:', process.cwd());
console.log('BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '<YOUR_BOT_TOKEN_HERE>';
console.log('BOT_TOKEN:', BOT_TOKEN); // Debug: print the bot token
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-1001970739822'; // Replace with your group ID
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Store wallet verification requests in memory (use DB for production)
const walletRequests = {};

bot.onText(/\/start (.+)/, async (msg, match) => {
  const param = match[1];
  const userId = msg.from.id;
  // Referral: /start ref_{wallet}
  if (param.startsWith('ref_')) {
    const referrerWallet = param.replace('ref_', '');
    console.log(`[BOT] Referral: user ${userId} joined with referrer wallet: ${referrerWallet}`);
    // Notify backend of referral
    try {
      const backendUrl = process.env.API_URL
        ? `${process.env.API_URL}/api/epwx/telegram-referral`
        : 'http://localhost:4000/api/epwx/telegram-referral';
      await axios.post(backendUrl, { referrerWallet, telegramUserId: userId });
      console.log(`[BOT] Notified backend of referral: ${referrerWallet} -> ${userId}`);
    } catch (err) {
      console.error('[BOT] Failed to notify backend for referral:', err?.response?.data || err);
    }
    bot.sendMessage(msg.chat.id, `Welcome! You joined with a referral. To verify your Telegram membership, please join our group at https://t.me/ePowerX_On_Base and then reply with /verify.`);
    // Optionally, you can notify the referrer here if you want
    return;
  }
  // Default: treat as wallet verification
  const wallet = param;
  console.log(`[BOT] Received /start with wallet: ${wallet} from user: ${userId}`);
  walletRequests[userId] = wallet;
  bot.sendMessage(msg.chat.id, `Hi! To verify your Telegram membership, please join our group at https://t.me/ePowerX_On_Base and then reply with /verify.`);
});

bot.onText(/\/verify/, async (msg) => {
  const userId = msg.from.id;
  const wallet = walletRequests[userId];
  console.log(`[BOT] Received /verify from user: ${userId}, wallet: ${wallet}`);
  if (!wallet) {
    console.log(`[BOT] No wallet found for user: ${userId}`);
    bot.sendMessage(msg.chat.id, 'No wallet address found. Please use the verification link from the dApp.');
    return;
  }
  // Check group membership
  try {
    const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_ID}&user_id=${userId}`);
    const status = res.data.result.status;
    console.log(`[BOT] Group membership status for user ${userId}: ${status}`);
    if (['member', 'administrator', 'creator'].includes(status)) {
      bot.sendMessage(msg.chat.id, `✅ Verified! You are a member of the EPWX group. Your wallet: ${wallet}`);
      // Notify backend to set telegramVerified for this wallet
      try {
        const backendUrl = process.env.API_URL
          ? `${process.env.API_URL}/api/epwx/telegram-verify`
          : 'http://localhost:4000/api/epwx/telegram-verify';
        await axios.post(backendUrl, { wallet });
        console.log(`[BOT] Notified backend to set telegramVerified for wallet: ${wallet}`);
      } catch (notifyErr) {
        console.error('[BOT] Failed to notify backend for telegram verification:', notifyErr?.response?.data || notifyErr);
      }
    } else {
      bot.sendMessage(msg.chat.id, '❌ You are not a member of the EPWX group. Please join at https://t.me/ePowerX_On_Base and try again.');
    }
  } catch (err) {
    console.log(`[BOT] Error verifying membership for user ${userId}:`, err?.response?.data || err);
    bot.sendMessage(msg.chat.id, 'Error verifying membership. Please try again later.');
  }
});

console.log('Telegram bot running...');
