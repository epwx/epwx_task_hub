import axios from 'axios';

const TELEGRAM_BOT_USERNAME = String(process.env.TELEGRAM_BOT_USERNAME || 'epwx_bot').replace(/^@/, '');
const TELEGRAM_BOT_GROUP_LINK = `https://t.me/${encodeURIComponent(TELEGRAM_BOT_USERNAME)}?startgroup=true`;

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

  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

function formatCount(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatBadgeDisplay(badgeLabel) {
  const normalizedBadgeLabel = typeof badgeLabel === 'string' ? badgeLabel.trim() : badgeLabel;
  if (!normalizedBadgeLabel || ['null', 'undefined', 'none', 'n/a'].includes(String(normalizedBadgeLabel).toLowerCase())) {
    return null;
  }

  switch (normalizedBadgeLabel) {
    case 'Whale Buyer':
      return '🟡 👑 Whale Buyer';
    case 'Tier Buyer':
      return '🟢 🛡️ Tier Buyer';
    case 'Buyer':
      return '🔵 🎖️ Buyer';
    default:
      return normalizedBadgeLabel || null;
  }
}

function hasDisplayValue(value) {
  if (typeof value !== 'string') {
    return Boolean(value);
  }

  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && !['null', 'undefined', 'none', 'n/a'].includes(normalized);
}

function getTimeUntilNextDraw() {
  const AUTO_DAILY_DRAW_TIME_UTC = String(process.env.AUTO_DAILY_DRAW_TIME_UTC || '00:05').trim();
  const matched = AUTO_DAILY_DRAW_TIME_UTC.match(/^(\d{2}):(\d{2})$/);
  if (!matched) {
    return null;
  }

  const hour = Number.parseInt(matched[1], 10);
  const minute = Number.parseInt(matched[2], 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hour,
    minute,
    0,
    0,
  ));

  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  const msRemaining = next.getTime() - now.getTime();
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return `${hoursRemaining}h ${minutesRemaining}m`;
}

export function buildDailyClaimPaidMessage({ wallet, amount, claimedAt, txHash, badgeLabel, badgeBenefit, totalDailyClaimsCount, isNewWallet }) {
  const safeShortWallet = escapeHtml(shortenHex(wallet));
  const safeAmount = escapeHtml(formatEpwxAmount(amount));
  const safeClaimedAt = escapeHtml(formatClaimTimestamp(claimedAt));
  const badgeDisplay = formatBadgeDisplay(badgeLabel);
  const safeBadgeDisplay = badgeDisplay ? escapeHtml(badgeDisplay) : null;
  const totalDailyClaimsCountDisplay = formatCount(totalDailyClaimsCount);
  const safeTotalDailyClaimsCount = totalDailyClaimsCountDisplay ? escapeHtml(totalDailyClaimsCountDisplay) : null;
  const txLink = txHash ? `https://basescan.org/tx/${encodeURIComponent(txHash)}` : null;

  const lines = [
    '<b>EPWX Daily Reward Sent</b>',
    'Sent on Base',
    '',
    `<b>Wallet</b>  <code>${safeShortWallet}</code>`,
    `<b>Amount</b>: ${safeAmount} EPWX`,
    `<b>Time</b>: ${safeClaimedAt}`,
  ];

  const timeUntilNextDraw = getTimeUntilNextDraw();
  if (timeUntilNextDraw) {
    lines.push(`<b>Next Draw In</b>: ${timeUntilNextDraw}`);
  }

  lines.push('');

  if (safeBadgeDisplay) {
    lines.push(`<b>Badge</b>: ${safeBadgeDisplay}`);
  }


  if (safeTotalDailyClaimsCount) {
    lines.push(`<b>Total Claims Today</b>: ${safeTotalDailyClaimsCount}`);
  }

  if (isNewWallet) {
    lines.push('<b>Status</b>: 🆕 New Wallet');
  }

  if (hasDisplayValue(badgeBenefit)) {
    lines.push(`<b>Benefit</b>: ${escapeHtml(badgeBenefit)}`);
  }

  lines.push(
    '',
    '<a href="https://tasks.epowex.com/#daily-claim">Claim Daily Free EPWX</a> • <a href="https://tasks.epowex.com/#buy-epwx">Buy EPWX</a> • <a href="https://coinmarketcap.com/currencies/epowerx-on-base/">CMC Watchlist</a>',
    `<a href="${TELEGRAM_BOT_GROUP_LINK}">Add @${escapeHtml(TELEGRAM_BOT_USERNAME)} to your Telegram group. Group owner earns lifetime rewards for every member daily claim from their group.</a>`,
  );

  if (txHash && txLink) {
    lines.push(`<b>Tx</b>: <code>${escapeHtml(shortenHex(txHash))}</code>`);
    lines.push(`<a href="${txLink}">View on Basescan</a>`);
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