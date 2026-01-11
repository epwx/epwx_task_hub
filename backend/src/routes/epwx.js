
import express from 'express';
import { DailyClaim } from '../models/index.js';
import { ethers } from 'ethers';
import { getEPWXPurchaseTransactions } from '../services/epwxCashback.js';
import { CashbackClaim } from '../models/index.js';
const router = express.Router();

// GET /api/epwx/daily-claims?admin=0x...
router.get('/daily-claims', async (req, res) => {
  const { admin } = req.query;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const claims = await DailyClaim.findAll({ order: [['claimedAt', 'DESC']] });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/epwx/daily-claims/mark-paid
router.post('/daily-claims/mark-paid', async (req, res) => {
  const { admin, claimId } = req.body;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const claim = await DailyClaim.findByPk(claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    claim.status = 'paid';
    await claim.save();
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/daily-claim', async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !signature) return res.status(400).json({ error: 'wallet and signature are required' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Verify signature
  const message = `EPWX Daily Claim for ${wallet} on ${now.toISOString().slice(0, 10)}`;
  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  if (recovered.toLowerCase() !== wallet.toLowerCase()) {
    return res.status(401).json({ error: 'Signature does not match wallet' });
  }

  // Check if wallet claimed in last 24h
  const walletClaim = await DailyClaim.findOne({
    where: {
      wallet: wallet.toLowerCase(),
      claimedAt: { $gte: since }
    }
  });
  if (walletClaim) {
    return res.status(429).json({ error: 'Wallet already claimed in the last 24 hours.' });
  }

  // Check if IP claimed in last 24h
  const ipClaim = await DailyClaim.findOne({
    where: {
      ip,
      claimedAt: { $gte: since }
    }
  });
  if (ipClaim) {
    return res.status(429).json({ error: 'IP address already claimed in the last 24 hours.' });
  }

  // TODO: Send EPWX to wallet here (call contract or queue for admin)
  // For now, just record the claim
  await DailyClaim.create({ wallet: wallet.toLowerCase(), ip, claimedAt: now });
  res.json({ success: true, message: 'Daily claim successful!' });
});

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

    // Validate that the txHash belongs to the wallet (user must be the recipient)
    // Fetch the last 3 hours of purchase transactions for this wallet
    const sinceTimestamp = Math.floor(Date.now() / 1000) - (3 * 3600);
    const userTxs = await getEPWXPurchaseTransactions(wallet, sinceTimestamp);
    const validTx = userTxs.find(tx => tx.txHash === txHash && tx.amount === amount);
    if (!validTx) {
      return res.status(403).json({ error: 'Transaction not eligible for claim or does not belong to wallet.' });
    }

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
  const { admin, wallet } = req.query;
  if (admin) {
    // Only allow admin wallet to access all claims
    if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
      const claims = await CashbackClaim.findAll({ order: [['claimedAt', 'DESC']] });
      res.json({ claims });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }
  if (wallet) {
    // Allow any user to fetch their own claims
    try {
      const claims = await CashbackClaim.findAll({ where: { wallet }, order: [['claimedAt', 'DESC']] });
      res.json({ claims });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }
  return res.status(400).json({ error: 'Missing admin or wallet parameter' });
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
