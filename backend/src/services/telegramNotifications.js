import axios from 'axios';

function hasTelegramConfig() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_GROUP_ID);
}

function escapeTelegramMarkdown(value = '') {
  return String(value).replace(/([_\*\[\]\(\)~`>#+\-=|{}.!\\])/g, '\\$1');
}

function formatClaimTimestamp(claimedAt) {
  if (!claimedAt) {
    return 'Unknown';
  }

  const date = new Date(claimedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toISOString();
}

export function buildDailyClaimPaidMessage({ wallet, amount, claimedAt, txHash }) {
  const lines = [
    '✅ *Daily claim paid*',
    `Wallet: ${escapeTelegramMarkdown(wallet || 'Unknown')}`,
    `Amount: ${escapeTelegramMarkdown(amount || 'Unknown')} EPWX`,
    `Claimed at: ${escapeTelegramMarkdown(formatClaimTimestamp(claimedAt))}`,
  ];

  if (txHash) {
    lines.push(`Tx: ${escapeTelegramMarkdown(txHash)}`);
  }

  return lines.join('\n');
}

export async function sendTelegramGroupMessage(text) {
  if (!hasTelegramConfig()) {
    return { sent: false, reason: 'telegram_not_configured' };
  }

  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_GROUP_ID,
      text,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    });

    return { sent: true, reason: 'sent' };
  } catch (error) {
    console.error('[telegramNotifications] Failed to send Telegram message:', error?.response?.data || error.message);
    return { sent: false, reason: 'telegram_send_failed' };
  }
}

export async function notifyDailyClaimPaid(claim) {
  const message = buildDailyClaimPaidMessage(claim);
  return sendTelegramGroupMessage(message);
}