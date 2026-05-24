
import express from 'express';
import { User, DailyClaim, CashbackClaim, SpecialClaim, Claim, RewardDistributionLedger, Merchant } from '../models/index.js';
import { Op } from 'sequelize';
// import { ethers } from 'ethers'; // Removed duplicate import
import { getEPWXPurchaseTransactions } from '../services/epwxCashback.js';
import { ethers } from 'ethers';
import { epwxTokenContract, epwxTokenWithSigner } from '../services/blockchain.js';
const router = express.Router();

const DAILY_REWARD_DEFAULT = '100000';
const DAILY_REWARD_MID_TIER = '120000';
const DAILY_REWARD_BONUS = '200000';
const DAILY_REWARD_BONUS_THRESHOLD = ethers.parseUnits('100000000000', 9);
const DAILY_REWARD_MID_TIER_THRESHOLD = ethers.parseUnits('10000000000', 9);

function getUtcDayRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function getDailyRewardAmount(wallet) {
  if (!epwxTokenContract) {
    throw new Error('EPWX token contract not configured');
  }

  const balance = await epwxTokenContract.balanceOf(wallet);
  if (balance >= DAILY_REWARD_BONUS_THRESHOLD) {
    return DAILY_REWARD_BONUS;
  }

  if (balance >= DAILY_REWARD_MID_TIER_THRESHOLD) {
    return DAILY_REWARD_MID_TIER;
  }

  return DAILY_REWARD_DEFAULT;
}

// POST /api/epwx/claims/mark-paid - Mark claim as paid (admin only)
router.post('/claims/mark-paid', async (req, res) => {
  // DEBUG: Log route hit and admin values for troubleshooting
  console.log('--- mark-paid route HIT ---');
  console.log('admin:', req.body.admin, 'ADMIN_WALLETS:', process.env.ADMIN_WALLETS);
  const { admin, claimId, txHash } = req.body;
  // Support multiple admin wallets (comma-separated, case-insensitive)
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase());
  if (!admin || !adminWallets.length || !adminWallets.includes(admin.toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const claim = await Claim.findByPk(claimId);
    if (!claim) {
      console.log('[mark-paid] Claim not found for id:', claimId);
      return res.status(404).json({ error: 'Claim not found' });
    }
    // Debug: log claim object to inspect wallet field
    console.log('[mark-paid] claim object:', claim);
    if (!txHash) {
      return res.status(400).json({ error: 'Transaction hash required for verification.' });
    }
    if (!ethers.isHexString(txHash, 32)) {
      return res.status(400).json({ error: 'Invalid transaction hash.' });
    }

    claim.status = 'paid';
    claim.txHash = txHash;
    await claim.save();
    console.log('[mark-paid] Updated claim:', claim.id, 'status:', claim.status);

    // Insert into RewardDistributionLedger with detailed logging
    try {
      const merchant = await Merchant.findByPk(claim.merchantId);
      console.log('[RewardLedger] Attempting insert:', {
        date: new Date(),
        merchant_id: claim.merchantId,
        merchant_name: merchant ? merchant.name : '',
        customer_id: claim.customer,
        receipt_id: claim.id.toString(),
        epwx_amount: claim.cashbackAmount || '',
        fiat_value: null,
        transaction_hash: txHash,
        notes: 'Cashback claim paid'
      });
    // Centralized default cashback amount for all cashback logic
    const DEFAULT_CASHBACK = '100000';

      const epwxAmount = (claim.cashbackAmount && !isNaN(Number(claim.cashbackAmount))) ? String(claim.cashbackAmount) : DEFAULT_CASHBACK;
      const ledgerEntry = await RewardDistributionLedger.create({
        date: new Date(),
        merchant_id: claim.merchantId,
        merchant_name: merchant ? merchant.name : '',
        customer_id: claim.customer,
        receipt_id: claim.id.toString(),
        epwx_amount: epwxAmount,
        fiat_value: null,
        transaction_hash: txHash,
        notes: 'Cashback claim paid'
      });
      console.log('[RewardLedger] Insert successful, entry id:', ledgerEntry.id);
    } catch (ledgerErr) {
      console.error('[RewardLedger] Failed to insert RewardDistributionLedger entry:', ledgerErr);
    }

    res.json({ success: true, claim });
  } catch (err) {
    console.error('[mark-paid] Error:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET /api/epwx/special-claim/list (admin only)
router.get('/special-claim/list', async (req, res) => {
  const { admin } = req.query;
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase());
  if (!admin || !adminWallets.length || !adminWallets.includes(admin.toLowerCase())) {
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
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase());
  if (!admin || !adminWallets.length || !adminWallets.includes(admin.toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });

  // Support comma-separated wallets
  const wallets = wallet.split(',').map(w => w.trim()).filter(w => w);
  if (wallets.length === 0) return res.status(400).json({ error: 'No valid wallet addresses provided' });

  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const results = [];

  for (const w of wallets) {
    try {
      if (!/^0x[a-fA-F0-9]{40}$/.test(w)) {
        results.push({ wallet: w, error: 'Invalid wallet address' });
        continue;
      }
      const lowerWallet = w.toLowerCase();
      const existing = await SpecialClaim.findOne({
        where: {
          wallet: lowerWallet,
          status: 'pending',
          createdAt: { [Op.gte]: threeHoursAgo }
        }
      });
      if (existing) {
        existing.createdAt = now;
        await existing.save();
        results.push({ wallet: lowerWallet, updated: true });
      } else {
        await SpecialClaim.create({ wallet: lowerWallet, createdAt: now });
        results.push({ wallet: lowerWallet, created: true });
      }
    } catch (err) {
      results.push({ wallet: w, error: err.message });
    }
  }
  return res.json({ success: true, results });
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
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase());
  if (!admin || !adminWallets.length || !adminWallets.includes(admin.toLowerCase())) {
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
      // Create user if not found, provide a default username
      const userData = {
        walletAddress: wallet.toLowerCase(),
        telegramVerified: true,
        username: wallet.toLowerCase(), // Use wallet address as default username
        email: wallet.toLowerCase() + '@telegram.epwx', // Placeholder email
        password: 'telegram-bot' // Placeholder password (should be random/secure in production)
      };
      console.log('[TELEGRAM VERIFY] DEBUG userData:', JSON.stringify(userData));
      user = await User.create(userData);
      console.log(`[TELEGRAM VERIFY] Created new user for wallet: ${wallet.toLowerCase()}`);
    } else if (!user.telegramVerified) {
      user.telegramVerified = true;
      await user.save();
      console.log(`[TELEGRAM VERIFY] Updated telegramVerified for wallet: ${wallet.toLowerCase()}`);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[TELEGRAM VERIFY] Error during user creation:', err);
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

// GET /api/epwx/daily-claims/summary
router.get('/daily-claims/summary', async (req, res) => {
  const { start, end } = getUtcDayRange();
  const claimedAt = { [Op.gte]: start, [Op.lt]: end };

  try {
    const [totalClaimsToday, totalPaidToday] = await Promise.all([
      DailyClaim.count({ where: { claimedAt } }),
      DailyClaim.count({ where: { claimedAt, status: 'paid' } }),
    ]);

    res.set('Cache-Control', 'no-store');
    return res.json({
      todayUtc: start.toISOString().slice(0, 10),
      totalClaimsToday,
      totalPaidToday,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/epwx/daily-claims?admin=0x...
router.get('/daily-claims', async (req, res) => {
  const { admin, wallet, status, limit } = req.query;
  if (admin) {
    const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
    if (!ADMIN_WALLETS.includes(admin.toLowerCase())) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
      const where = {};
      if (status) where.status = status;
      const query = { order: [['claimedAt', 'DESC']], where };
      if (limit) query.limit = parseInt(limit);
      const claims = await DailyClaim.findAll(query);
      return res.json({ claims });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  // For public/latest paid claims (no wallet, no admin)
  if (status === 'paid' && limit) {
    try {
      const claims = await DailyClaim.findAll({
        where: { status: 'paid' },
        order: [['claimedAt', 'DESC']],
        limit: parseInt(limit)
      });
      return res.json({ claims });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (wallet) {
    try {
      const where = { wallet: wallet.toLowerCase() };
      if (status) where.status = status;
      const query = { where, order: [['claimedAt', 'DESC']] };
      if (limit) query.limit = parseInt(limit);
      const claims = await DailyClaim.findAll(query);
      return res.json({ claims });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(400).json({ error: 'Missing admin, wallet, or required parameters' });
});

// POST /api/epwx/daily-claims/mark-paid
router.post('/daily-claims/mark-paid', async (req, res) => {
  const { admin, claimId, txHash } = req.body;
  const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  if (!ADMIN_WALLETS.includes(admin.toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const claim = await DailyClaim.findByPk(claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    claim.status = 'paid';
    claim.txHash = txHash;
    await claim.save();
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reward-ledger - Return all reward distribution ledger entries
router.get('/reward-ledger', async (req, res) => {
  try {
    const entries = await RewardDistributionLedger.findAll({ order: [['date', 'DESC']] });
    res.json({ ledger: entries });
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
  let rewardAmount;
  try {
    rewardAmount = await getDailyRewardAmount(wallet.toLowerCase());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to determine daily reward amount right now.' });
  }

  await DailyClaim.create({ wallet: wallet.toLowerCase(), ip, claimedAt: now, amount: rewardAmount });
  res.json({
    success: true,
    amount: rewardAmount,
    message: `Daily claim successful for ${rewardAmount} EPWX!`,
  });
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
    // Only allow admin wallet(s) to access all claims
    const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
    if (!ADMIN_WALLETS.includes(admin.toLowerCase())) {
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

export default router;
