import { SecurityAuthorization } from '../models/index.js';
import {
  createAdminAuthorizationPurpose,
  createAdminRequestAuthorizationMessage,
  verifyAndConsumeAuthorization,
} from '../utils/signedAuthorization.js';

function getAdminWallets() {
  return (process.env.ADMIN_WALLETS || '')
    .split(',')
    .map(wallet => wallet.trim().toLowerCase())
    .filter(Boolean);
}

export async function authorizeSignedAdmin(req, res) {
  const authorization = {
    wallet: req.headers['x-admin-wallet'],
    issuedAt: req.headers['x-admin-issued-at'],
    nonce: req.headers['x-admin-nonce'],
    signature: req.headers['x-admin-signature'],
  };
  const body = ['GET', 'HEAD'].includes(req.method) ? '' : JSON.stringify(req.body || {});
  const message = createAdminRequestAuthorizationMessage({
    wallet: authorization.wallet,
    method: req.method,
    requestPath: req.originalUrl,
    body,
    issuedAt: authorization.issuedAt,
    nonce: authorization.nonce,
  });
  const result = await verifyAndConsumeAuthorization({
    authorization,
    expectedWallet: authorization.wallet,
    purpose: createAdminAuthorizationPurpose({
      method: req.method,
      requestPath: req.originalUrl,
    }),
    message,
    allowedWallets: getAdminWallets(),
    authorizationModel: SecurityAuthorization,
  });

  if (!result.ok) {
    res.status(result.status).json({ error: result.error, success: false });
    return null;
  }

  req.adminWallet = result.wallet;
  return result.wallet;
}

export async function requireSignedAdmin(req, res, next) {
  try {
    const wallet = await authorizeSignedAdmin(req, res);
    if (wallet) next();
  } catch (error) {
    console.error('Administrative authorization error:', error);
    res.status(500).json({ error: 'Administrative authorization failed.', success: false });
  }
}
