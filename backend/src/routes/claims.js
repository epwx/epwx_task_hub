import express from 'express';
import { Claim } from '../models/index.js';

const router = express.Router();

// POST /api/claims/add - Add a new customer claim
router.post('/add', async (req, res) => {
  const { merchantId, customer, bill, lat, lng } = req.body;
  if (!merchantId || !customer || lat == null || lng == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // TODO: Add geofencing and 24-hour claim rule validation here
  try {
    const claim = await Claim.create({ merchantId, customer, bill, lat, lng, status: 'pending' });
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/claims - List claims (admin only, filter by status)
router.get('/', async (req, res) => {
  const { admin, status } = req.query;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const where = status ? { status } : {};
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
