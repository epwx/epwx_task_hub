import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { User } from '../models/index.js';

const router = express.Router();

const MINI_APP_NONCE_TTL_MS = Number.parseInt(process.env.TELEGRAM_MINIAPP_NONCE_TTL_MS || '300000', 10);
const TELEGRAM_AUTH_MAX_AGE_SECONDS = Number.parseInt(process.env.TELEGRAM_MINIAPP_AUTH_MAX_AGE_SECONDS || '86400', 10);
const walletChallenges = new Map();
let usersTableColumnsCache = null;

async function getUsersTableColumns() {
  if (usersTableColumnsCache) {
    return usersTableColumnsCache;
  }

  try {
    const queryInterface = User.sequelize.getQueryInterface();
    usersTableColumnsCache = await queryInterface.describeTable('users');
    return usersTableColumnsCache;
  } catch {
    usersTableColumnsCache = {};
    return usersTableColumnsCache;
  }
}

function normalizeWallet(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function parseAndVerifyInitData(initDataRaw) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured.' };
  }

  if (!initDataRaw || typeof initDataRaw !== 'string') {
    return { ok: false, error: 'initData is required.' };
  }

  const params = new URLSearchParams(initDataRaw);
  const providedHash = params.get('hash');
  if (!providedHash) {
    return { ok: false, error: 'initData hash is missing.' };
  }

  const keyValuePairs = [];
  for (const [key, value] of params.entries()) {
    if (key !== 'hash') {
      keyValuePairs.push(`${key}=${value}`);
    }
  }

  keyValuePairs.sort();
  const dataCheckString = keyValuePairs.join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const providedHashBuffer = Buffer.from(providedHash, 'hex');
  const expectedHashBuffer = Buffer.from(expectedHash, 'hex');
  if (providedHashBuffer.length !== expectedHashBuffer.length || !crypto.timingSafeEqual(providedHashBuffer, expectedHashBuffer)) {
    return { ok: false, error: 'Invalid Telegram initData hash.' };
  }

  const authDateRaw = params.get('auth_date');
  const authDateSeconds = Number.parseInt(String(authDateRaw || ''), 10);
  if (!Number.isInteger(authDateSeconds)) {
    return { ok: false, error: 'initData auth_date is missing or invalid.' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (authDateSeconds > nowSeconds + 60 || nowSeconds - authDateSeconds > TELEGRAM_AUTH_MAX_AGE_SECONDS) {
    return { ok: false, error: 'Telegram initData is expired. Reopen the Mini App and try again.' };
  }

  let telegramUser;
  try {
    telegramUser = JSON.parse(params.get('user') || '{}');
  } catch {
    return { ok: false, error: 'Unable to parse Telegram user payload.' };
  }

  const telegramUserId = telegramUser?.id ? String(telegramUser.id) : '';
  if (!telegramUserId) {
    return { ok: false, error: 'Telegram user id not found in initData.' };
  }

  return {
    ok: true,
    telegramUser: {
      id: telegramUserId,
      username: telegramUser?.username ? String(telegramUser.username) : null,
      firstName: telegramUser?.first_name ? String(telegramUser.first_name) : null,
      lastName: telegramUser?.last_name ? String(telegramUser.last_name) : null,
      languageCode: telegramUser?.language_code ? String(telegramUser.language_code) : null,
    },
  };
}

function buildWalletLinkMessage({ wallet, telegramUserId, nonce, issuedAtIso }) {
  return [
    'EPWX Telegram Mini App Wallet Link',
    `Telegram User: ${telegramUserId}`,
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAtIso}`,
  ].join('\n');
}

function createWalletChallenge({ wallet, telegramUserId }) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = new Date();
  const expiresAt = issuedAt.getTime() + MINI_APP_NONCE_TTL_MS;
  const message = buildWalletLinkMessage({
    wallet,
    telegramUserId,
    nonce,
    issuedAtIso: issuedAt.toISOString(),
  });

  const challengeKey = `${telegramUserId}:${wallet}`;
  walletChallenges.set(challengeKey, {
    nonce,
    message,
    expiresAt,
  });

  return {
    nonce,
    message,
    expiresAt,
    challengeKey,
  };
}

function getValidWalletChallenge({ wallet, telegramUserId }) {
  const challengeKey = `${telegramUserId}:${wallet}`;
  const challenge = walletChallenges.get(challengeKey);

  if (!challenge) {
    return { ok: false, error: 'Wallet challenge not found. Request a new challenge.' };
  }

  if (Date.now() > challenge.expiresAt) {
    walletChallenges.delete(challengeKey);
    return { ok: false, error: 'Wallet challenge expired. Request a new challenge.' };
  }

  return { ok: true, challenge, challengeKey };
}

function sanitizeBaseUsername(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized.length >= 3) {
    return normalized.slice(0, 28);
  }

  return 'tg_user';
}

async function buildUniqueUsername(baseName, wallet) {
  const walletSuffix = normalizeWallet(wallet).slice(2, 8) || crypto.randomBytes(3).toString('hex');

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0
      ? `${baseName}_${walletSuffix}`
      : `${baseName}_${walletSuffix}_${attempt}`;

    const existing = await User.findOne({ where: { username: candidate } });
    if (!existing) {
      return candidate;
    }
  }

  return `tg_${crypto.randomBytes(6).toString('hex')}`;
}

router.post('/auth', async (req, res) => {
  const { initData } = req.body;
  const verification = parseAndVerifyInitData(initData);
  if (!verification.ok) {
    return res.status(401).json({ error: verification.error });
  }

  const { telegramUser } = verification;

  try {
    const columns = await getUsersTableColumns();
    const supportsTelegramUserId = Boolean(columns.telegramUserId);
    const supportsTelegramUsername = Boolean(columns.telegramUsername);

    let user = null;
    if (supportsTelegramUserId) {
      user = await User.findOne({ where: { telegramUserId: telegramUser.id } });
    } else if (supportsTelegramUsername && telegramUser.username) {
      user = await User.findOne({ where: { telegramUsername: telegramUser.username } });
    }

    return res.json({
      success: true,
      telegramUser,
      linkedWallet: user?.walletAddress || null,
      telegramVerified: Boolean(user?.telegramVerified),
      migrationRequired: !supportsTelegramUserId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/wallet/nonce', (req, res) => {
  const { initData, walletAddress } = req.body;
  const verification = parseAndVerifyInitData(initData);
  if (!verification.ok) {
    return res.status(401).json({ error: verification.error });
  }

  const normalizedWallet = normalizeWallet(walletAddress);
  if (!/^0x[a-f0-9]{40}$/.test(normalizedWallet)) {
    return res.status(400).json({ error: 'walletAddress must be a valid EVM wallet address.' });
  }

  const challenge = createWalletChallenge({
    wallet: normalizedWallet,
    telegramUserId: verification.telegramUser.id,
  });

  return res.json({
    success: true,
    walletAddress: normalizedWallet,
    nonce: challenge.nonce,
    message: challenge.message,
    expiresAt: Math.floor(challenge.expiresAt / 1000),
  });
});

router.post('/wallet/connect', async (req, res) => {
  const { initData, walletAddress, signature } = req.body;
  const verification = parseAndVerifyInitData(initData);
  if (!verification.ok) {
    return res.status(401).json({ error: verification.error });
  }

  const normalizedWallet = normalizeWallet(walletAddress);
  if (!/^0x[a-f0-9]{40}$/.test(normalizedWallet)) {
    return res.status(400).json({ error: 'walletAddress must be a valid EVM wallet address.' });
  }

  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'signature is required.' });
  }

  const { telegramUser } = verification;
  const challengeResult = getValidWalletChallenge({
    wallet: normalizedWallet,
    telegramUserId: telegramUser.id,
  });

  if (!challengeResult.ok) {
    return res.status(400).json({ error: challengeResult.error });
  }

  let recovered;
  try {
    recovered = ethers.verifyMessage(challengeResult.challenge.message, signature).toLowerCase();
  } catch {
    return res.status(400).json({ error: 'Invalid wallet signature.' });
  }

  if (recovered !== normalizedWallet) {
    return res.status(401).json({ error: 'Signature does not match walletAddress.' });
  }

  try {
    const columns = await getUsersTableColumns();
    const supportsTelegramUserId = Boolean(columns.telegramUserId);
    const supportsTelegramUsername = Boolean(columns.telegramUsername);

    const existingByTelegram = supportsTelegramUserId
      ? await User.findOne({ where: { telegramUserId: telegramUser.id } })
      : null;
    const existingByWallet = await User.findOne({ where: { walletAddress: normalizedWallet } });

    if (existingByTelegram && existingByWallet && existingByTelegram.id !== existingByWallet.id) {
      return res.status(409).json({ error: 'This Telegram account and wallet are already linked to different users.' });
    }

    if (supportsTelegramUserId && existingByWallet && existingByWallet.telegramUserId && existingByWallet.telegramUserId !== telegramUser.id) {
      return res.status(409).json({ error: 'This wallet is already linked to another Telegram account.' });
    }

    let user = existingByTelegram || existingByWallet;
    if (!user) {
      const baseName = sanitizeBaseUsername(telegramUser.username || telegramUser.firstName || `tg_${telegramUser.id}`);
      const username = await buildUniqueUsername(baseName, normalizedWallet);
      const safeEmailLocal = `${telegramUser.id}.${normalizedWallet.slice(2, 8)}`;

      user = await User.create({
        walletAddress: normalizedWallet,
        telegramVerified: true,
        ...(supportsTelegramUserId ? { telegramUserId: telegramUser.id } : {}),
        ...(supportsTelegramUsername ? { telegramUsername: telegramUser.username || null } : {}),
        username,
        email: `${safeEmailLocal}@telegram.epwx`,
        password: crypto.randomBytes(24).toString('hex'),
        lastLogin: new Date(),
      });
    } else {
      user.walletAddress = normalizedWallet;
      user.telegramVerified = true;
      if (supportsTelegramUserId) {
        user.telegramUserId = telegramUser.id;
      }
      if (supportsTelegramUsername) {
        user.telegramUsername = telegramUser.username || user.telegramUsername || null;
      }
      user.lastLogin = new Date();
      await user.save();
    }

    walletChallenges.delete(challengeResult.challengeKey);

    const token = jwt.sign(
      {
        userId: user.id,
        walletAddress: user.walletAddress,
        telegramUserId: user.telegramUserId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          telegramUserId: supportsTelegramUserId ? user.telegramUserId : null,
          telegramUsername: supportsTelegramUsername ? user.telegramUsername : null,
          telegramVerified: user.telegramVerified,
        },
        token,
      },
      migrationRequired: !supportsTelegramUserId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;