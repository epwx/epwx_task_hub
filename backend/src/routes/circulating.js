console.log('Loaded circulating route');
const express = require('express');
const router = express.Router();
const { getCirculatingSupply } = require('../services/circulating');

// GET /api/circulating - Returns the circulating supply of EPWX
router.get('/circulating', async (req, res) => {
  try {
    const circulatingSupply = await getCirculatingSupply();
    res.json({ circulatingSupply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch circulating supply' });
  }
});

module.exports = router;
