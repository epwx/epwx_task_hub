import express from 'express';
import { Claim } from '../models/index.js';

const router = express.Router();

// POST /api/claims/add - Add a new customer claim
router.post('/add', async (req, res) => {
  const { merchantId, customer, bill, lat, lng } = req.body;
  if (!merchantId || !customer || lat == null || lng == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Restrict by IP for 24 hours
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || req.socket?.remoteAddress;
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  try {
    // Check if this IP has claimed in last 24h
    const ipClaim = await Claim.findOne({
      where: {
        ip,
        createdAt: { $gte: since }
      }
    });
    if (ipClaim) {
      const lastClaim = new Date(ipClaim.createdAt);
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const msLeft = nextClaim - now;
      const hours = Math.floor(msLeft / (1000 * 60 * 60));
      const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      return res.status(429).json({ error: `IP address already claimed. Try again in ${hours}h ${minutes}m.` });
    }
    // Create claim with IP
    const claim = await Claim.create({ merchantId, customer, bill, lat, lng, status: 'pending', ip });
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/claims - List claims
// - If merchantId is provided, return claims for that merchant (view-only, no admin required)
// - If admin is provided, return all claims (optionally filter by status)
router.get('/', async (req, res) => {
  const { admin, status, merchantId } = req.query;
  try {
    let where = {};
    if (merchantId) {
      where = { merchantId };
    } else if (admin === '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
      if (status) where = { status };
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const claims = await Claim.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/claims/:id/mark-status - Update claim status (admin only)
router.post('/:id/mark-status', async (req, res) => {
  const { admin, status } = req.body;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    const claim = await Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    claim.status = status;
    await claim.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
