import crypto from 'crypto';

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;

function getCodeSecret() {
  const secret = process.env.MERCHANT_CLAIM_CODE_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('MERCHANT_CLAIM_CODE_SECRET or JWT_SECRET must be configured.');
  }
  return secret;
}

export function generateMerchantClaimCode() {
  let code = '';
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeMerchantClaimCode(code) {
  return String(code || '').trim().toUpperCase().replace(/[\s-]+/g, '');
}

export function hashMerchantClaimCode(code) {
  return crypto
    .createHmac('sha256', getCodeSecret())
    .update(normalizeMerchantClaimCode(code))
    .digest('hex');
}

export function createMerchantCodeAuthorizationMessage(merchantId, issuedAt, nonce) {
  return `EPWX Merchant Claim Code\nMerchant: ${merchantId}\nIssued At: ${issuedAt}\nNonce: ${nonce}`;
}

export function hashMerchantCodeAuthorization(signature) {
  return crypto.createHash('sha256').update(String(signature)).digest('hex');
}