import express from 'express';
import { getTotalSupply } from '../services/supply.js';
const router = express.Router();

// GET /api/supply - Returns the total supply net of verifiably burned EPWX
router.get('/supply', async (req, res) => {
  try {
    const totalSupply = await getTotalSupply();
    res.type('application/json').send(totalSupply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch total supply' });
  }
});

export default router;
