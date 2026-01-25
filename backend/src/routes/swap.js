
import express from 'express';
import swapService from '../services/swap.js';
import { SwapClaim } from '../models/index.js';

const router = express.Router();

// POST /api/swap/eth-to-epwx
router.post('/eth-to-epwx', async (req, res) => {
  const { userAddress, ethAmount } = req.body;

  import express from 'express';
  import swapService from '../services/swap.js';
  import { SwapClaim } from '../models/index.js';

  const router = express.Router();

  // POST /api/swap/eth-to-epwx
  router.post('/eth-to-epwx', async (req, res) => {
    const { userAddress, ethAmount } = req.body;
    if (!userAddress || !ethAmount) {
      return res.status(400).json({ success: false, error: 'Missing userAddress or ethAmount' });
    }
    try {
      const result = await swapService.swapEthToEpwx(userAddress, ethAmount);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: 'Swap failed', details: err.message });
    }
  });

  // POST /api/swap/claim
  router.post('/claim', async (req, res) => {
    const { userAddress, epwxAmount } = req.body;
    if (!userAddress || !epwxAmount) {
      return res.status(400).json({ success: false, error: 'Missing userAddress or epwxAmount' });
    }
    try {
      await SwapClaim.create({
        wallet: userAddress,
        amount: epwxAmount,
        claimAmount: epwxAmount,
        status: 'pending',
      });
      res.json({ success: true, pending: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to record claim', details: err.message });
    }
  });

  // GET /api/swap/claims?admin=wallet&status=pending|paid
  router.get('/claims', async (req, res) => {
    const { admin, status } = req.query;
    // TODO: Replace with your admin wallet address
    const ADMIN_WALLET = '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735'.toLowerCase();
    if (!admin || admin.toLowerCase() !== ADMIN_WALLET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const where = {};
    if (status) where.status = status;
    try {
      const claims = await SwapClaim.findAll({ where, order: [['claimedAt', 'DESC']] });
      res.json({ claims });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/swap/claims/mark-paid
  router.post('/claims/mark-paid', async (req, res) => {
    const { admin, claimId } = req.body;
    const ADMIN_WALLET = '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735'.toLowerCase();
    if (!admin || admin.toLowerCase() !== ADMIN_WALLET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!claimId) return res.status(400).json({ error: 'claimId is required' });
    try {
      const claim = await SwapClaim.findByPk(claimId);
      if (!claim) return res.status(404).json({ error: 'Claim not found' });
      claim.status = 'paid';
      await claim.save();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  export default router;
