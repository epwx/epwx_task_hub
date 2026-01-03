const express = require('express');
const router = express.Router();
const { getBurnedSupply } = require('../services/burned');

// GET /api/burned - Returns the total burned supply of EPWX
router.get('/burned', async (req, res) => {
  try {
    const burnedSupply = await getBurnedSupply();
    res.json({ burnedSupply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch burned supply' });
  }
});

module.exports = router;
