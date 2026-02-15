// DEBUG: Print admin wallets env variable on backend startup
console.log('BACKEND ENV NEXT_PUBLIC_ADMIN_WALLETS:', process.env.NEXT_PUBLIC_ADMIN_WALLETS);

import express from 'express';
import { Claim, Merchant } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// POST /api/epwx/claims/mark-paid - Mark claim as paid (admin only)
router.post('/epwx/claims/mark-paid', async (req, res) => {
  const { admin, claimId } = req.body;
  // Support multiple admin wallets (comma-separated, case-insensitive)
  const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase());
  console.log('Received admin value:', admin, 'Allowed:', adminWallets);
  if (!admin || !adminWallets.length || !adminWallets.includes(admin.toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!claimId) return res.status(400).json({ error: 'claimId is required' });
  try {
    const claim = await Claim.findByPk(claimId);
    if (!claim) {
      console.log('[mark-paid] Claim not found for id:', claimId);
      return res.status(404).json({ error: 'Claim not found' });
    }
    claim.status = 'paid';
    await claim.save();
    console.log('[mark-paid] Updated claim:', claim.id, 'status:', claim.status);
    res.json({ success: true, claim });
  } catch (err) {
    console.error('[mark-paid] Error:', err);
    res.status(500).json({ error: err.message });
  }
});


function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/claims/add - Add a new customer claim
router.post('/add', async (req, res) => {
  const { merchantId, customer, bill, lat, lng } = req.body;
  if (!merchantId || !customer || lat == null || lng == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Geofencing: check if user is near merchant
  const merchant = await Merchant.findByPk(merchantId);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }
  const distance = haversineDistance(Number(lat), Number(lng), merchant.latitude, merchant.longitude);
  if (distance > 100) {
    return res.status(403).json({ error: `You must be at the shop to claim. Distance: ${distance.toFixed(1)} meters.` });
  }
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || req.socket?.remoteAddress;
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const customerLc = customer.toLowerCase();
  console.log('Claim attempt:', { ip, customer: customerLc });
  try {
    // Restrict by customer (wallet) for 24 hours
    const walletClaim = await Claim.findOne({
      where: {
        customer: customerLc,
        createdAt: { [Op.gte]: since }
      }
    });
    if (walletClaim) {
      const lastClaim = new Date(walletClaim.createdAt);
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const msLeft = nextClaim - now;
      const hours = Math.floor(msLeft / (1000 * 60 * 60));
      const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      console.log('Blocked by wallet:', customerLc, 'Last:', lastClaim);
      return res.status(429).json({ error: `Wallet already claimed. Try again in ${hours}h ${minutes}m.` });
    }
    // Restrict by IP for 24 hours
    const ipClaim = await Claim.findOne({
      where: {
        ip,
        createdAt: { [Op.gte]: since }
      }
    });
    if (ipClaim) {
      const lastClaim = new Date(ipClaim.createdAt);
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const msLeft = nextClaim - now;
      const hours = Math.floor(msLeft / (1000 * 60 * 60));
      const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      console.log('Blocked by IP:', ip, 'Last:', lastClaim);
      return res.status(429).json({ error: `IP address already claimed. Try again in ${hours}h ${minutes}m.` });
    }
    // Create claim with IP
    const claim = await Claim.create({ merchantId, customer: customerLc, bill, lat, lng, status: 'pending', ip });
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
    } else if (admin && adminWallets.includes(admin.toLowerCase())) {
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
  if (!admin || !adminWallets.length || !adminWallets.includes(admin.toLowerCase())) {
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
