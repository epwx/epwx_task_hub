// GET /api/epwx/telegram-referral-rewards?admin=...&status=pending|paid
router.get('/telegram-referral-rewards', async (req, res) => {
  const { admin, status } = req.query;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    let where = {};
    if (status === 'pending') {
      where = { [Op.or]: [{ referrerRewarded: false }, { referredRewarded: false }] };
    } else if (status === 'paid') {
      where = { referrerRewarded: true, referredRewarded: true };
    }
    const rewards = await TelegramReferral.findAll({ where, order: [['joinedAt', 'DESC']] });
    res.json({ rewards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/epwx/telegram-referral-reward/mark-paid
router.post('/telegram-referral-reward/mark-paid', async (req, res) => {
  const { admin, referralId, referrer, referred } = req.body;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!referralId) return res.status(400).json({ error: 'referralId is required' });
  try {
    const referral = await TelegramReferral.findByPk(referralId);
    if (!referral) return res.status(404).json({ error: 'Referral not found' });
    if (referrer) referral.referrerRewarded = true;
    if (referred) referral.referredRewarded = true;
    await referral.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/epwx/telegram-referral-stats?wallet=...
router.get('/telegram-referral-stats', async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  try {
    const count = await TelegramReferral.count({ where: { referrerWallet: wallet.toLowerCase() } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
import { TelegramReferral } from '../models/index.js';

// POST /api/epwx/telegram-referral
router.post('/telegram-referral', async (req, res) => {
  const { referrerWallet, telegramUserId } = req.body;
  if (!referrerWallet || !telegramUserId) {
    return res.status(400).json({ error: 'referrerWallet and telegramUserId are required' });
  }
  try {
    // Prevent duplicate referrals for the same Telegram user
    const existing = await TelegramReferral.findOne({ where: { telegramUserId } });
    if (existing) {
      return res.json({ success: false, message: 'Referral already recorded for this user' });
    }
    await TelegramReferral.create({ referrerWallet: referrerWallet.toLowerCase(), telegramUserId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

import express from 'express';
import { User, DailyClaim, CashbackClaim, SpecialClaim } from '../models/index.js';
import { Op } from 'sequelize';
import { ethers } from 'ethers';
import { getEPWXPurchaseTransactions } from '../services/epwxCashback.js';

const router = express.Router();

// GET /api/epwx/special-claim/list (admin only)
router.get('/special-claim/list', async (req, res) => {
  const { admin } = req.query;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const claims = await SpecialClaim.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/epwx/special-claim/add (admin only)
router.post('/special-claim/add', async (req, res) => {
  const { admin, wallet } = req.body;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  try {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    // Check for existing pending claim within 3 hours
    const existing = await SpecialClaim.findOne({
      where: {
        wallet: wallet.toLowerCase(),
        status: 'pending',
        createdAt: { [Op.gte]: threeHoursAgo }
      }
    });
    if (existing) {
      // Update createdAt to now
      existing.createdAt = now;
      await existing.save();
      return res.json({ success: true, updated: true });
    } else {
      await SpecialClaim.create({ wallet: wallet.toLowerCase(), createdAt: now });
      return res.json({ success: true, created: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/epwx/special-claim/claim
router.post('/special-claim/claim', async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  try {
    // Find latest pending claim within 3 hours
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const claim = await SpecialClaim.findOne({
      where: {
        wallet: wallet.toLowerCase(),
        status: 'pending',
        createdAt: { [Op.gte]: threeHoursAgo }
      },
      order: [['createdAt', 'DESC']]
    });
    if (!claim) {
      return res.status(404).json({ error: 'No valid claim found (expired or already claimed)' });
    }
    // Check Telegram verification
    const user = await User.findOne({ where: { walletAddress: wallet.toLowerCase() } });
    if (!user || !user.telegramVerified) {
      return res.status(403).json({ error: 'Telegram not verified' });
    }
    // Mark as userClaimed (for admin UI eligibility)
    claim.userClaimed = true;
    await claim.save();
    res.json({ success: true, message: 'Special claim submitted. Pending admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/epwx/special-claim/approve (admin only)
router.post('/special-claim/approve', async (req, res) => {
  const { admin, wallet } = req.body;
  if (admin !== '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  try {
    // Find latest pending claim within 3 hours
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const claim = await SpecialClaim.findOne({
      where: {
        wallet: wallet.toLowerCase(),
        status: 'pending',
        createdAt: { [Op.gte]: threeHoursAgo }
      },
      order: [['createdAt', 'DESC']]
    });
    if (!claim) {
      return res.status(404).json({ error: 'No valid pending claim found' });
    }
    claim.status = 'claimed';
    claim.claimedAt = now;
    await claim.save();
    // TODO: Send 1 million EPWX to wallet (manual or contract call)
    res.json({ success: true, message: 'Special claim approved and marked as claimed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Optional) GET /api/epwx/special-claim/status?wallet=...
router.get('/special-claim/status', async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  try {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const claim = await SpecialClaim.findOne({
      where: {
        wallet: wallet.toLowerCase(),
        status: 'pending',
        createdAt: { [Op.gte]: threeHoursAgo }
      },
      order: [['createdAt', 'DESC']]
    });
    res.json({ eligible: !!claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/epwx/telegram-verify
router.post('/telegram-verify', async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  try {
    let user = await User.findOne({ where: { walletAddress: wallet.toLowerCase() } });
    if (!user) {
      // Create user if not found
      user = await User.create({ walletAddress: wallet.toLowerCase(), telegramVerified: true });
      console.log(`[TELEGRAM VERIFY] Created new user for wallet: ${wallet.toLowerCase()}`);
    } else if (!user.telegramVerified) {
      user.telegramVerified = true;
      await user.save();
      console.log(`[TELEGRAM VERIFY] Updated telegramVerified for wallet: ${wallet.toLowerCase()}`);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/epwx/telegram-verified?wallet=0x...
router.get('/telegram-verified', async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  try {
    const user = await User.findOne({ where: { walletAddress: wallet.toLowerCase() } });
    console.log('Queried wallet:', wallet.toLowerCase(), 'User found:', user);
    res.json({ verified: !!(user && user.telegramVerified) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayUtc = utcDate.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Verify signature
  const message = `EPWX Daily Claim for ${wallet} on ${todayUtc}`;
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
      claimedAt: { [Op.gte]: since }
    }
  });
  if (walletClaim) {
    const lastClaim = new Date(walletClaim.claimedAt);
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    const nowTime = new Date();
    const msLeft = nextClaim - nowTime;
    const hours = Math.floor(msLeft / (1000 * 60 * 60));
    const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    return res.status(429).json({ error: `Wallet already claimed. Try again in ${hours}h ${minutes}m.` });
  }

  // Check if IP claimed in last 24h
  const ipClaim = await DailyClaim.findOne({
    where: {
      ip,
      claimedAt: { [Op.gte]: since }
    }
  });
  if (ipClaim) {
    const lastClaim = new Date(ipClaim.claimedAt);
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    const nowTime = new Date();
    const msLeft = nextClaim - nowTime;
    const hours = Math.floor(msLeft / (1000 * 60 * 60));
    const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    return res.status(429).json({ error: `IP address already claimed. Try again in ${hours}h ${minutes}m.` });
  }

  // TODO: Send EPWX to wallet here (call contract or queue for admin)
  // For now, just record the claim
  await DailyClaim.create({ wallet: wallet.toLowerCase(), ip, claimedAt: now });
  res.json({ success: true, message: 'Daily claim successful!' });
});



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
    const cashbackAmount = (parseFloat(amount) * 0.03).toString(); // 3% cashback
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
