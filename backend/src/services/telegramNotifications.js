import axios from 'axios';

function hasTelegramConfig() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_GROUP_ID);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortenHex(value) {
  if (!value || value.length <= 14) {
    return value || 'Unknown';
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatEpwxAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return String(amount || 'Unknown');
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

function formatClaimTimestamp(claimedAt) {
  if (!claimedAt) {
    return 'Unknown';
  }

  const date = new Date(claimedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return `${date.toISOString().replace('T', ' ').replace('.000Z', '').replace('Z', '')} UTC`;
}

export function buildDailyClaimPaidMessage({ wallet, amount, claimedAt, txHash }) {
  const safeWallet = escapeHtml(wallet || 'Unknown');
  const safeShortWallet = escapeHtml(shortenHex(wallet));
  const safeAmount = escapeHtml(formatEpwxAmount(amount));
  const safeClaimedAt = escapeHtml(formatClaimTimestamp(claimedAt));
  const safeTxHash = txHash ? escapeHtml(txHash) : null;
  const txLink = txHash ? `https://basescan.org/tx/${encodeURIComponent(txHash)}` : null;

  const lines = [
    '<b>EPWX Daily Reward Sent</b>',
    '',
    `<b>Wallet</b>: <code>${safeShortWallet}</code>`,
    `<blockquote expandable>${safeWallet}</blockquote>`,
    `<b>Amount</b>: ${safeAmount} EPWX`,
    `<b>Claimed At</b>: ${safeClaimedAt}`,
    '<a href="https://tasks.epowex.com">Open EPWX Task Hub</a>',
    '<a href="https://tasks.epowex.com/#buy-epwx">Buy EPWX</a>',
  ];

  if (safeTxHash && txLink) {
    lines.push(`<b>Transaction</b>: <code>${escapeHtml(shortenHex(txHash))}</code>`);
    lines.push(`<a href="${txLink}">View on Basescan</a>`);
    lines.push(`<blockquote expandable>${safeTxHash}</blockquote>`);
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
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    return { sent: true, reason: 'sent' };
  } catch (error) {
    const telegramError = error?.response?.data?.description || error?.message || 'Unknown Telegram error';
    console.error('[telegramNotifications] Failed to send Telegram message:', error?.response?.data || error.message);
    return { sent: false, reason: 'telegram_send_failed', error: telegramError };
  }
}

export async function notifyDailyClaimPaid(claim) {
  const message = buildDailyClaimPaidMessage(claim);
  return sendTelegramGroupMessage(message);
}