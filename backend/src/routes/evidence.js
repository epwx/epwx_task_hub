import express from 'express';
import { resolveAuthorizedEvidencePath } from '../utils/evidenceAccess.js';

const router = express.Router();

router.get('/', (req, res) => {
  const filePath = resolveAuthorizedEvidencePath({
    relativePath: req.query.path,
    expiresAt: req.query.expires,
    signature: req.query.signature,
  });
  if (!filePath) {
    return res.status(403).json({ error: 'Evidence link is invalid or expired.' });
  }
  res.setHeader('Cache-Control', 'private, no-store');
  return res.sendFile(filePath);
});

export default router;
