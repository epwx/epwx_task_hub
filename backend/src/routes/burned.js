import express from 'express';
import { getBurnedSupply } from '../services/burned.js';
const router = express.Router();

// GET /api/burned - Returns the total burned supply of EPWX
router.get('/burned', async (req, res) => {
  try {
    const burnedSupply = await getBurnedSupply();
    res.json({ burnedSupply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch burned supply' });
  }
});

export default router;
