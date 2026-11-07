import crypto from 'crypto';
import { getAddress, verifyMessage } from 'ethers';

const AUTHORIZATION_MAX_AGE_MS = 5 * 60 * 1000;

function hashText(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function normalizeWallet(wallet) {
  try {
    return getAddress(String(wallet || '')).toLowerCase();
  } catch {
    return null;
  }
}

export function createTaskSubmissionAuthorizationMessage({
  wallet,
  campaignId,
  twitterUsername,
  issuedAt,
  nonce,
}) {
  return [
    'EPWX Task Submission',
    `Wallet: ${String(wallet).toLowerCase()}`,
    `Campaign: ${campaignId}`,
    `Twitter: ${String(twitterUsername).trim().replace(/^@/, '').toLowerCase()}`,
    `Issued At: ${issuedAt}`,
    `Nonce: ${nonce}`,
  ].join('\n');
}

export function createAdminClaimAuthorizationMessage({
  wallet,
  claimId,
  action,
  status = '',
  reason = '',
  issuedAt,
  nonce,
}) {
  return [
    'EPWX Admin Claim Action',
    `Wallet: ${String(wallet).toLowerCase()}`,
    `Claim: ${claimId}`,
    `Action: ${action}`,
    `Status: ${status}`,
    `Reason SHA-256: ${hashText(String(reason).trim())}`,
    `Issued At: ${issuedAt}`,
    `Nonce: ${nonce}`,
  ].join('\n');
}

export function createAdminRequestAuthorizationMessage({
  wallet,
  method,
  requestPath,
  body,
  issuedAt,
  nonce,
}) {
  return [
    'EPWX Administrative Request',
    `Wallet: ${String(wallet).toLowerCase()}`,
    `Method: ${String(method).toUpperCase()}`,
    `Path: ${requestPath}`,
    `Body SHA-256: ${hashText(body || '')}`,
    `Issued At: ${issuedAt}`,
    `Nonce: ${nonce}`,
  ].join('\n');
}

export function createReferralAuthorizationMessage({
  referrerWallet,
  referredWallet,
  issuedAt,
  nonce,
}) {
  return [
    'EPWX Wallet Referral',
    `Referrer: ${String(referrerWallet).toLowerCase()}`,
    `Referred Wallet: ${String(referredWallet).toLowerCase()}`,
    `Issued At: ${issuedAt}`,
    `Nonce: ${nonce}`,
  ].join('\n');
}

export function createWalletLoginMessage({
  wallet,
  domain,
  chainId,
  issuedAt,
  expiresAt,
  nonce,
}) {
  return [
    'EPWX Task Hub Login',
    `Domain: ${domain}`,
    `Wallet: ${String(wallet).toLowerCase()}`,
    `Chain ID: ${chainId}`,
    `Issued At: ${issuedAt}`,
    `Expires At: ${expiresAt}`,
    `Nonce: ${nonce}`,
  ].join('\n');
}

export function hashAuthorizationValue(value) {
  return hashText(value);
}

export async function verifyAndConsumeAuthorization({
  authorization,
  expectedWallet,
  purpose,
  message,
  allowedWallets,
  authorizationModel,
  now = Date.now(),
}) {
  const issuedAtMs = Date.parse(authorization?.issuedAt);
  const nonce = String(authorization?.nonce || '');
  const signature = String(authorization?.signature || '');
  const normalizedExpectedWallet = normalizeWallet(expectedWallet);

  if (
    !normalizedExpectedWallet
    || !signature
    || nonce.length < 16
    || nonce.length > 200
    || !Number.isFinite(issuedAtMs)
    || Math.abs(now - issuedAtMs) > AUTHORIZATION_MAX_AGE_MS
  ) {
    return { ok: false, status: 401, error: 'A recent wallet authorization is required.' };
  }

  let recoveredWallet;
  try {
    recoveredWallet = verifyMessage(message, signature).toLowerCase();
  } catch {
    return { ok: false, status: 401, error: 'Invalid wallet authorization.' };
  }

  if (recoveredWallet !== normalizedExpectedWallet) {
    return { ok: false, status: 403, error: 'Wallet authorization does not match the requested wallet.' };
  }

  if (allowedWallets && !allowedWallets.includes(recoveredWallet)) {
    return { ok: false, status: 403, error: 'Unauthorized' };
  }

  const authorizationHash = hashText(`${purpose}:${signature}`);
  try {
    await authorizationModel.create({
      authorizationHash,
      walletAddress: recoveredWallet,
      purpose,
      expiresAt: new Date(issuedAtMs + AUTHORIZATION_MAX_AGE_MS),
    });
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return { ok: false, status: 409, error: 'This wallet authorization has already been used.' };
    }
    throw error;
  }

  return { ok: true, wallet: recoveredWallet };
}
