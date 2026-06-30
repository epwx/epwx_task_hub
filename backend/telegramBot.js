import dotenv from 'dotenv';
dotenv.config();
// Simple Node.js Telegram bot for group membership verification
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '<YOUR_BOT_TOKEN_HERE>';
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-1001970739822'; // Replace with your group ID
const BOT_USERNAME_FALLBACK = (process.env.TELEGRAM_BOT_USERNAME || 'ePowerXBot').replace(/^@/, '');
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tasks.epowex.com';
const MINI_APP_URL = process.env.TELEGRAM_MINIAPP_URL || `${FRONTEND_URL.replace(/\/$/, '')}/telegram-miniapp`;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
let resolvedBotUsername = BOT_USERNAME_FALLBACK;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const walletRequestsFile = path.join(__dirname, '.telegram-wallet-requests.json');

// Keep a persisted copy so /verify still works after PM2 restarts.
const walletRequests = {};

function buildMiniAppKeyboard(chatType = 'private') {
  const isPrivate = chatType === 'private';
  const launchUrl = isPrivate
    ? MINI_APP_URL
    : `https://t.me/${resolvedBotUsername}?start=miniapp`;

  return {
    reply_markup: {
      inline_keyboard: [[
        isPrivate
          ? {
              text: 'Open Daily Claim Mini App',
              web_app: { url: launchUrl },
            }
          : {
              text: 'Open Bot Private Chat',
              url: launchUrl,
            },
      ]],
    },
  };
}

function buildPrivateStartUrl(param) {
  return `https://t.me/${resolvedBotUsername}?start=${encodeURIComponent(param)}`;
}

function isGroupChat(chatType = '') {
  return chatType === 'group' || chatType === 'supergroup';
}

async function isChatOwner(chatId, userId) {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(String(chatId))}&user_id=${encodeURIComponent(String(userId))}`);
    const status = String(res?.data?.result?.status || '').toLowerCase();
    return status === 'creator';
  } catch {
    return false;
  }
}

function groupStartParam(prefix, groupId) {
  const safeGroupId = String(groupId || '').replace(/[^0-9-]/g, '');
  return `${prefix}_${safeGroupId}`;
}

async function resolveBotUsername() {
  try {
    const me = await bot.getMe();
    if (me?.username) {
      resolvedBotUsername = String(me.username).replace(/^@/, '');
      console.log(`[BOT] Resolved bot username: @${resolvedBotUsername}`);
      return;
    }
  } catch (error) {
    console.error('[BOT] Failed to resolve bot username from Telegram API:', error?.response?.data || error.message);
  }

  console.log(`[BOT] Using fallback bot username: @${resolvedBotUsername}`);
}

async function configureMiniAppMenuButton() {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      menu_button: {
        type: 'web_app',
        text: 'Daily Claim',
        web_app: { url: MINI_APP_URL },
      },
    });
  } catch (error) {
    console.error('[BOT] Failed to set menu button:', error?.response?.data || error.message);
  }
}

async function configureBotCommands() {
  try {
    await bot.setMyCommands([
      { command: 'miniapp', description: 'Open EPWX Daily Claim Mini App' },
      { command: 'verify', description: 'Verify Telegram group membership' },
      { command: 'registergroup', description: 'Register this group for owner rewards (owner only)' },
      { command: 'postdailyclaimbutton', description: 'Post Daily Claim button in this group (owner only)' },
    ]);
  } catch (error) {
    console.error('[BOT] Failed to set bot commands:', error?.response?.data || error.message);
  }
}

async function loadWalletRequests() {
  try {
    const raw = await fs.readFile(walletRequestsFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      Object.assign(walletRequests, parsed);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[BOT] Failed to load wallet requests cache:', error);
    }
  }
}

async function saveWalletRequests() {
  try {
    await fs.writeFile(walletRequestsFile, JSON.stringify(walletRequests, null, 2), 'utf8');
  } catch (error) {
    console.error('[BOT] Failed to persist wallet requests cache:', error);
  }
}

await loadWalletRequests();
await resolveBotUsername();
await configureBotCommands();
await configureMiniAppMenuButton();

bot.onText(/\/start (.+)/, async (msg, match) => {
  const param = match[1];
  const userId = msg.from.id;
  const normalizedParam = String(param || '').trim().toLowerCase();

  if (normalizedParam.startsWith('groupreg_')) {
    const groupId = String(param).slice('groupreg_'.length);
    const groupMiniAppUrl = `${MINI_APP_URL}?registerGroupId=${encodeURIComponent(groupId)}`;
    bot.sendMessage(
      msg.chat.id,
      'Open Mini App and connect your wallet to register this group for owner rewards.',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Register Group Owner Rewards',
              web_app: { url: groupMiniAppUrl },
            },
          ]],
        },
      }
    );
    return;
  }

  if (normalizedParam.startsWith('groupclaim_')) {
    const groupId = String(param).slice('groupclaim_'.length);
    const groupMiniAppUrl = `${MINI_APP_URL}?sourceGroupId=${encodeURIComponent(groupId)}`;
    bot.sendMessage(
      msg.chat.id,
      'Open Mini App to claim Daily EPWX from this group campaign.',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Daily Claim',
              web_app: { url: groupMiniAppUrl },
            },
          ]],
        },
      }
    );
    return;
  }

  if (['miniapp', 'claim', 'daily'].includes(normalizedParam)) {
    bot.sendMessage(
      msg.chat.id,
      'Open the EPWX Daily Claim Mini App using the button below. This is the recommended flow for all groups.',
      buildMiniAppKeyboard(msg.chat?.type)
    );
    return;
  }

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
    bot.sendMessage(msg.chat.id,
      'Daily claim works through Mini App for all groups.\n\n' +
      'Optional legacy verification flow:\n' +
      'Step 1: Join our group: https://t.me/ePowerX_On_Base\n' +
      'Step 2: Click /verify below in this chat (legacy only).',
      buildMiniAppKeyboard(msg.chat?.type)
    );
    // Optionally, you can notify the referrer here if you want
    return;
  }
  // Default: treat as wallet verification
  const wallet = param;
  console.log(`[BOT] Received /start with wallet: ${wallet} from user: ${userId}`);
  walletRequests[userId] = wallet;
  await saveWalletRequests();
  bot.sendMessage(msg.chat.id,
    'Daily claim works through Mini App for all groups.\n\n' +
    'Optional legacy verification flow:\n' +
    'Step 1: Join our group: https://t.me/ePowerX_On_Base\n' +
    'Step 2: Click /verify below in this chat (legacy only).',
    buildMiniAppKeyboard(msg.chat?.type)
  );
});

bot.onText(/\/start$/, async (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Use the button below to open EPWX Daily Claim Mini App (works for all groups). If you need legacy verification, open the verification link from EPWX Task Hub and then tap /verify.',
    buildMiniAppKeyboard(msg.chat?.type)
  );
});

bot.onText(/^\/miniapp(?:@\w+)?$/i, async (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Open the EPWX Daily Claim Mini App (recommended for all groups):',
    buildMiniAppKeyboard(msg.chat?.type)
  );
});

bot.onText(/^\/registergroup(?:@\w+)?$/i, async (msg) => {
  if (!isGroupChat(msg.chat?.type)) {
    bot.sendMessage(msg.chat.id, 'Use /registergroup inside your Telegram group.');
    return;
  }

  const isOwner = await isChatOwner(msg.chat.id, msg.from.id);
  if (!isOwner) {
    bot.sendMessage(msg.chat.id, 'Only the group owner can register this group for owner rewards.');
    return;
  }

  const startParam = groupStartParam('groupreg', msg.chat.id);
  const privateUrl = buildPrivateStartUrl(startParam);

  bot.sendMessage(msg.chat.id, 'Admin verified. Open private chat to complete group registration:', {
    reply_markup: {
      inline_keyboard: [[{ text: 'Complete Registration', url: privateUrl }]],
    },
  });
});

bot.onText(/^\/postdailyclaimbutton(?:@\w+)?$/i, async (msg) => {
  if (!isGroupChat(msg.chat?.type)) {
    bot.sendMessage(msg.chat.id, 'Use /postdailyclaimbutton inside your Telegram group.');
    return;
  }

  const isOwner = await isChatOwner(msg.chat.id, msg.from.id);
  if (!isOwner) {
    bot.sendMessage(msg.chat.id, 'Only the group owner can post the Daily Claim button.');
    return;
  }

  const startParam = groupStartParam('groupclaim', msg.chat.id);
  const privateUrl = buildPrivateStartUrl(startParam);

  bot.sendMessage(msg.chat.id, 'Tap to open EPWX Daily Claim:', {
    reply_markup: {
      inline_keyboard: [[{ text: 'Daily Claim', url: privateUrl }]],
    },
  });
});

bot.onText(/\/verify/, async (msg) => {
  const userId = msg.from.id;
  const wallet = walletRequests[userId];
  console.log(`[BOT] Received /verify from user: ${userId}, wallet: ${wallet}`);
  if (!wallet) {
    console.log(`[BOT] No wallet found for user: ${userId}`);
    bot.sendMessage(msg.chat.id, 'No wallet address found. Daily claim does not require /verify in Mini App mode. Use /miniapp to continue.');
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
        // Ensure no double /api in the backend URL
        let backendUrl;
        if (process.env.API_URL) {
          backendUrl = process.env.API_URL.endsWith('/api')
            ? `${process.env.API_URL}/epwx/telegram-verify`
            : `${process.env.API_URL}/api/epwx/telegram-verify`;
        } else {
          backendUrl = 'http://localhost:4000/api/epwx/telegram-verify';
        }
        await axios.post(backendUrl, { wallet: wallet.toLowerCase() });
        console.log(`[BOT] Notified backend to set telegramVerified for wallet: ${wallet.toLowerCase()}`);
        delete walletRequests[userId];
        await saveWalletRequests();
      } catch (notifyErr) {
        console.error('[BOT] Failed to notify backend for telegram verification:', {
          backendUrl: process.env.API_URL || 'http://localhost:4000',
          status: notifyErr?.response?.status || null,
          data: notifyErr?.response?.data || null,
          message: notifyErr?.message || 'Unknown error',
        });
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
