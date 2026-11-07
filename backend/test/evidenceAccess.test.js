import path from 'path';
import { createEvidenceUrl, resolveAuthorizedEvidencePath } from '../src/utils/evidenceAccess.js';

describe('evidence access', () => {
  const originalSecret = process.env.EVIDENCE_URL_SECRET;

  beforeAll(() => {
    process.env.EVIDENCE_URL_SECRET = 'test-evidence-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.EVIDENCE_URL_SECRET;
    } else {
      process.env.EVIDENCE_URL_SECRET = originalSecret;
    }
  });

  it('creates a short-lived URL that resolves only under uploads', () => {
    const url = new URL(createEvidenceUrl('uploads/receipts/proof.png'), 'https://api.example.test');
    const resolved = resolveAuthorizedEvidencePath({
      relativePath: url.searchParams.get('path'),
      expiresAt: url.searchParams.get('expires'),
      signature: url.searchParams.get('signature'),
    });

    expect(resolved).toBe(path.resolve(process.cwd(), 'uploads/receipts/proof.png'));
  });

  it('rejects path traversal even with arbitrary query values', () => {
    expect(resolveAuthorizedEvidencePath({
      relativePath: 'uploads/../.env',
      expiresAt: Date.now() + 60_000,
      signature: 'invalid',
    })).toBeNull();
  });
});
