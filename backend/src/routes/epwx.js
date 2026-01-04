
import express from 'express';
import { getEPWXPurchaseTransactions } from '../services/epwxCashback.js';
import { CashbackClaim } from '../models/index.js';
const router = express.Router();

// GET /api/epwx/purchases?wallet=0x...&hours=3
router.get('/purchases', async (req, res) => {
  const { wallet, hours } = req.query;
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  const sinceTimestamp = Math.floor(Date.now() / 1000) - ((parseInt(hours) || 3) * 3600);
  try {
    const txs = await getEPWXPurchaseTransactions(wallet, sinceTimestamp);
    res.json({ transactions: txs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/epwx/claim
router.post('/claim', async (req, res) => {
  const { wallet, txHash, amount } = req.body;
  if (!wallet || !txHash || !amount) return res.status(400).json({ error: 'wallet, txHash, and amount are required' });
  try {
    // Check if already claimed
    const existing = await CashbackClaim.findOne({ where: { wallet, txHash } });
    if (existing) return res.status(400).json({ error: 'Already claimed' });
    // Calculate 3% cashback
    const cashbackAmount = (parseFloat(amount) * 0.03).toString();
    const claim = await CashbackClaim.create({ wallet, txHash, amount, cashbackAmount, status: 'pending' });
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/epwx/claims?admin=0x...
router.get('/claims', async (req, res) => {
  const { admin } = req.query;
  // Only allow admin wallet to access
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const claims = await CashbackClaim.findAll({ order: [['claimedAt', 'DESC']] });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/epwx/claims/mark-paid
router.post('/claims/mark-paid', async (req, res) => {
  const { admin, claimId } = req.body;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const claim = await CashbackClaim.findByPk(claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    claim.status = 'paid';
    await claim.save();
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
