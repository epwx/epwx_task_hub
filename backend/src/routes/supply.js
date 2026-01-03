const express = require('express');
const router = express.Router();
const { getTotalSupply } = require('../services/supply');

// GET /api/supply - Returns the total supply of EPWX
router.get('/supply', async (req, res) => {
  try {
    const totalSupply = await getTotalSupply();
    res.json({ totalSupply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch total supply' });
  }
});

module.exports = router;
