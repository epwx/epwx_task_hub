import express from 'express';
import { Merchant } from '../models/index.js';

const router = express.Router();

// Admin-only middleware (supports multiple admin wallets from env)
function requireAdmin(req, res, next) {
  const admin = req.headers['x-admin-wallet'] || req.body.admin || req.query.admin;
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  if (!admin || !adminWallets.includes(admin.toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/merchants/add - Add a new merchant (admin only)
router.post('/add', requireAdmin, async (req, res) => {
  const { name, wallet, address, longitude, latitude } = req.body;
  if (!name || !address || longitude == null || latitude == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const merchant = await Merchant.create({ name, wallet: wallet ? wallet.toLowerCase() : null, address, longitude, latitude });
    res.json({ success: true, merchant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchants/list - List all merchants (admin only)
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const merchants = await Merchant.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ merchants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// GET /api/merchants/:id - Public endpoint to fetch merchant by ID
router.get('/:id', async (req, res) => {
  try {
    const merchant = await Merchant.findByPk(req.params.id);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
    res.json(merchant);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
