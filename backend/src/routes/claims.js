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

export default router;
