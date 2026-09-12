import nodemailer from 'nodemailer';
import { createHash, randomBytes } from 'crypto';
import DailyClaimEmailPreference from '../models/DailyClaimEmailPreference.js';
import DailyClaim from '../models/DailyClaim.js';

let transporter;

function getEmailConfig() {
  return {
    host: String(process.env.SMTP_HOST || '').trim(),
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
    user: String(process.env.SMTP_USER || '').trim(),
    pass: String(process.env.SMTP_PASS || ''),
    fromName: String(process.env.EMAIL_FROM_NAME || 'EPWX Daily Claims').trim(),
    fromAddress: String(process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || '').trim(),
    frontendUrl: String(process.env.FRONTEND_URL || 'https://tasks.epowex.com').replace(/\/$/, ''),
  };
}

function getTransporter(config) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatAmount(amount) {
  try {
    return BigInt(String(amount || '0')).toLocaleString('en-US');
  } catch {
    return String(amount || '0');
  }
}

async function sendEmail({ to, subject, text, html }) {
  const config = getEmailConfig();
  if (!config.host || !config.user || !config.pass || !config.fromAddress) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    await getTransporter(config).sendMail({
      from: { name: config.fromName, address: config.fromAddress },
      to,
      replyTo: process.env.EMAIL_REPLY_TO || config.fromAddress,
      subject,
      text,
      html,
    });
    return { sent: true, reason: 'sent' };
  } catch (error) {
    console.error('[emailNotifications] SMTP delivery failed:', error?.message || error);
    return { sent: false, reason: 'smtp_send_failed', error: error?.message || String(error) };
  }
}

export async function sendDailyClaimVerificationEmail({ email, verificationToken }) {
  const config = getEmailConfig();
  const verifyUrl = `${config.frontendUrl}/email/verify?token=${encodeURIComponent(verificationToken)}`;
  return sendEmail({
    to: email,
    subject: 'Verify your EPWX Daily Claim email',
    text: `Verify your email notifications: ${verifyUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<h1>Verify Daily Claim notifications</h1><p>Confirm that you want EPWX Daily Claim emails.</p><p><a href="${escapeHtml(verifyUrl)}">Verify email</a></p><p>If you did not request this, ignore this email.</p>`,
  });
}

export async function sendDailyClaimSuccessEmail({ preference, claim, unsubscribeToken }) {
  const config = getEmailConfig();
  const nextClaimAt = new Date(new Date(claim.claimedAt).getTime() + 24 * 60 * 60 * 1000);
  const claimUrl = `${config.frontendUrl}/#daily-claim`;
  const unsubscribeUrl = `${config.frontendUrl}/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const amount = formatAmount(claim.amount);
  return sendEmail({
    to: preference.email,
    subject: `Your ${amount} EPWX Daily Claim was successful`,
    text: `Your Daily Claim of ${amount} EPWX was successful. Your next claim is available after ${nextClaimAt.toISOString()}.\n\nClaim: ${claimUrl}\nUnsubscribe: ${unsubscribeUrl}`,
    html: `<h1>Daily Claim successful</h1><p><strong>${escapeHtml(amount)} EPWX</strong> was sent to your wallet.</p><p>Your next claim is available after ${escapeHtml(nextClaimAt.toUTCString())}.</p><p><a href="${escapeHtml(claimUrl)}">View Daily Claim</a></p><p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe from Daily Claim emails</a></p>`,
  });
}

export async function notifyDailyClaimSuccess(claim) {
  try {
    const preference = await DailyClaimEmailPreference.findOne({
      where: {
        wallet: String(claim.wallet || '').toLowerCase(),
        successEmailsEnabled: true,
        unsubscribedAt: null,
      },
    });

    if (!preference?.emailVerifiedAt) {
      return { sent: false, reason: 'email_not_enrolled' };
    }
    if (preference.lastSuccessClaimId === claim.id) {
      return { sent: false, reason: 'already_sent' };
    }

    const unsubscribeToken = randomBytes(32).toString('hex');
    preference.unsubscribeTokenHash = createHash('sha256').update(unsubscribeToken).digest('hex');
    await preference.save();

    const result = await sendDailyClaimSuccessEmail({ preference, claim, unsubscribeToken });
    if (result.sent) {
      preference.lastSuccessClaimId = claim.id;
      await preference.save();
    }
    return result;
  } catch (error) {
    console.error('[emailNotifications] Daily Claim success notification failed:', error?.message || error);
    return { sent: false, reason: 'email_notification_failed', error: error?.message || String(error) };
  }
}

async function sendDailyClaimReadyEmail({ preference, unsubscribeToken }) {
  const config = getEmailConfig();
  const claimUrl = `${config.frontendUrl}/#daily-claim`;
  const unsubscribeUrl = `${config.frontendUrl}/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  return sendEmail({
    to: preference.email,
    subject: 'Your EPWX Daily Claim is ready',
    text: `Your next EPWX Daily Claim is ready. Claim now: ${claimUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
    html: `<h1>Your Daily Claim is ready</h1><p>Your next EPWX reward is available now.</p><p><a href="${escapeHtml(claimUrl)}">Claim Daily EPWX</a></p><p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe from Daily Claim emails</a></p>`,
  });
}

export async function sendReadyDailyClaimReminders(now = new Date()) {
  const preferences = await DailyClaimEmailPreference.findAll({
    where: {
      remindersEnabled: true,
      unsubscribedAt: null,
    },
  });
  let sent = 0;
  let failed = 0;

  for (const preference of preferences) {
    try {
      if (!preference.emailVerifiedAt) continue;

      const latestClaim = await DailyClaim.findOne({
        where: { wallet: preference.wallet },
        order: [['claimedAt', 'DESC']],
      });
      if (!latestClaim || preference.lastReminderClaimId === latestClaim.id) continue;

      const readyAt = new Date(latestClaim.claimedAt).getTime() + 24 * 60 * 60 * 1000;
      if (readyAt > now.getTime()) continue;

      const unsubscribeToken = randomBytes(32).toString('hex');
      preference.unsubscribeTokenHash = createHash('sha256').update(unsubscribeToken).digest('hex');
      await preference.save();

      const result = await sendDailyClaimReadyEmail({ preference, unsubscribeToken });
      if (result.sent) {
        preference.lastReminderClaimId = latestClaim.id;
        await preference.save();
        sent += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      console.error(`[emailNotifications] Reminder failed for wallet ${preference.wallet}:`, error?.message || error);
    }
  }

  return { checked: preferences.length, sent, failed };
}