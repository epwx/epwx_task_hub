import crypto from 'crypto';
import path from 'path';

const EVIDENCE_TTL_MS = 5 * 60 * 1000;

function getEvidenceSecret() {
  const secret = process.env.EVIDENCE_URL_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('EVIDENCE_URL_SECRET or SESSION_SECRET must be configured.');
  }
  return secret;
}

function sign(relativePath, expiresAt) {
  return crypto
    .createHmac('sha256', getEvidenceSecret())
    .update(`${relativePath}:${expiresAt}`)
    .digest('hex');
}

export function createEvidenceUrl(relativePath) {
  if (!relativePath) return null;
  const normalizedPath = String(relativePath).replace(/\\+/g, '/').replace(/^\/+/, '');
  if (!normalizedPath.startsWith('uploads/')) return null;
  const expiresAt = Date.now() + EVIDENCE_TTL_MS;
  const signature = sign(normalizedPath, expiresAt);
  return `/api/evidence?path=${encodeURIComponent(normalizedPath)}&expires=${expiresAt}&signature=${signature}`;
}

export function resolveAuthorizedEvidencePath({ relativePath, expiresAt, signature }) {
  const normalizedPath = String(relativePath || '').replace(/\\+/g, '/').replace(/^\/+/, '');
  const expiry = Number(expiresAt);
  if (!normalizedPath.startsWith('uploads/') || !Number.isFinite(expiry) || expiry < Date.now()) {
    return null;
  }

  const expected = sign(normalizedPath, expiry);
  const provided = String(signature || '');
  if (provided.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return null;
  }

  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const resolvedPath = path.resolve(process.cwd(), normalizedPath);
  if (!resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return null;
  }
  return resolvedPath;
}
