console.log('Loaded circulating route');
import express from 'express';
import { getCirculatingSupply } from '../services/circulating.js';
const router = express.Router();

// GET /api/circulating - Returns the circulating supply of EPWX
router.get('/circulating', async (req, res) => {
  try {
    const circulatingSupply = await getCirculatingSupply();
    res.json({ circulatingSupply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch circulating supply' });
  }
});

export default router;
