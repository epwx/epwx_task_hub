import express from 'express';
import { getEPWXPrice } from '../services/price.js';
const router = express.Router();

/**
 * GET /api/price/epwx
 * Get current EPWX price and liquidity info
 */
router.get('/epwx', async (req, res) => {
  try {
    const priceData = await getEPWXPrice();
    res.json({
      success: true,
      data: priceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EPWX price'
    });
  }
});

export default router;
