const express = require('express');
const router = express.Router();
const { getEPWXPrice } = require('../services/price');

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

module.exports = router;
