
import express from 'express';
import { User, DailyClaim, CashbackClaim, SpecialClaim, Claim, RewardDistributionLedger, Merchant, WalletReferral } from '../models/index.js';
import { Op } from 'sequelize';
// import { ethers } from 'ethers'; // Removed duplicate import
import { getEPWXPurchaseTransactions } from '../services/epwxCashback.js';
import { notifyDailyClaimPaid } from '../services/telegramNotifications.js';
import { ethers } from 'ethers';
import { epwxTokenContract, epwxTokenWithSigner } from '../services/blockchain.js';
const router = express.Router();

const REFERRAL_REWARD_AMOUNT = '1000000';
const DEFAULT_DAILY_REWARD_AMOUNT = '100000';
const MID_TIER_DAILY_REWARD_AMOUNT = '2000000';
const BONUS_TIER_DAILY_REWARD_AMOUNT = '5000000';
const MEGA_TIER_DAILY_REWARD_AMOUNT = '10000000';
const MID_TIER_DAILY_REWARD_THRESHOLD = 10_000_000_000;
const BONUS_TIER_DAILY_REWARD_THRESHOLD = 100_000_000_000;
const MEGA_TIER_DAILY_REWARD_THRESHOLD = 1_000_000_000_000;
const EPWX_TOKEN_DECIMALS = 9;
const EPWX_REWARD_TRANSFER_FEE_BPS = Number(process.env.EPWX_REWARD_TRANSFER_FEE_BPS || '600');
const DAILY_REWARD_TIERS = [
  {
    minimumBalance: MEGA_TIER_DAILY_REWARD_THRESHOLD,
    amount: MEGA_TIER_DAILY_REWARD_AMOUNT,
    badgeLabel: 'Whale Buyer',
    badgeBenefit: 'Unlocks the highest daily claim tier at 10,000,000 EPWX per claim.',
  },
  {
    minimumBalance: BONUS_TIER_DAILY_REWARD_THRESHOLD,
    amount: BONUS_TIER_DAILY_REWARD_AMOUNT,
    badgeLabel: 'Tier Buyer',
    badgeBenefit: 'Qualifies the wallet for stronger daily reward progression and buyer positioning.',
  },
  {
    minimumBalance: MID_TIER_DAILY_REWARD_THRESHOLD,
    amount: MID_TIER_DAILY_REWARD_AMOUNT,
    badgeLabel: null,
    badgeBenefit: null,
  },
];

function normalizeWallet(wallet) {
  if (typeof wallet !== 'string') {
    return '';
  }

  return wallet.trim().toLowerCase();
}

function getRequestIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress || req.socket?.remoteAddress || null;
}

function getGrossRewardAmount(amount) {
  const normalizedAmount = BigInt(String(amount));

  if (!Number.isFinite(EPWX_REWARD_TRANSFER_FEE_BPS) || EPWX_REWARD_TRANSFER_FEE_BPS <= 0) {
    return normalizedAmount;
  }

  if (EPWX_REWARD_TRANSFER_FEE_BPS >= 10_000) {
    throw new Error('EPWX_REWARD_TRANSFER_FEE_BPS must be less than 10000.');
  }

  const denominator = 10_000n - BigInt(EPWX_REWARD_TRANSFER_FEE_BPS);
  return (normalizedAmount * 10_000n + denominator - 1n) / denominator;
}

async function distributeEpwxReward(wallet, amount) {
  if (!epwxTokenWithSigner) {
    console.error('[epwx-payout] Token signer is unavailable. Check blockchain environment configuration.');
    return { paid: false, txHash: null };
  }

  const grossAmount = getGrossRewardAmount(amount);
  const tx = await epwxTokenWithSigner.transfer(wallet, ethers.parseUnits(grossAmount.toString(), EPWX_TOKEN_DECIMALS));
  const receipt = await tx.wait();

  return {
    paid: receipt?.status === 1,
    txHash: tx.hash,
  };
}

async function distributeReferralReward(wallet) {
  return distributeEpwxReward(wallet, REFERRAL_REWARD_AMOUNT);
}

function findDailyRewardTierByAmount(amount) {
  const normalizedAmount = String(amount || '');
  return DAILY_REWARD_TIERS.find((entry) => entry.amount === normalizedAmount) || null;
}

function getDefaultDailyRewardDetails() {
  return {
    minimumBalance: 0,
    amount: DEFAULT_DAILY_REWARD_AMOUNT,
    badgeLabel: null,
    badgeBenefit: null,
  };
}

async function getDailyRewardDetails(wallet) {
  if (!epwxTokenContract) {
    return getDefaultDailyRewardDetails();
  }

  try {
    const balance = await epwxTokenContract.balanceOf(wallet);
    const normalizedBalance = Number(ethers.formatUnits(balance, EPWX_TOKEN_DECIMALS));
    const matchedTier = DAILY_REWARD_TIERS.find((entry) => normalizedBalance >= entry.minimumBalance);

    if (matchedTier) {
      return matchedTier;
    }
  } catch (error) {
    console.error('Failed to determine daily reward tier:', error);
  }

  return getDefaultDailyRewardDetails();
}

async function qualifyReferralReward({ referral, claim, ip, now }) {
  if (!referral || referral.status !== 'pending') {
    return null;
  }

  referral.claimIp = ip;
  referral.referredFirstClaimId = claim.id;
  referral.referredFirstClaimedAt = now;

  const referrerClaim = await DailyClaim.findOne({
    where: { wallet: referral.referrerWallet },
    order: [['claimedAt', 'ASC']],
  });

  if (referrerClaim?.ip && referrerClaim.ip === ip) {
    referral.status = 'blocked';
    referral.referrerRewardStatus = 'blocked';
    referral.referredRewardStatus = 'blocked';
    referral.disqualificationReason = 'Referrer and referred wallet cannot use the same IP address.';
    await referral.save();

    return {
      status: 'blocked',
      reason: referral.disqualificationReason,
      referrerRewardStatus: referral.referrerRewardStatus,
      referredRewardStatus: referral.referredRewardStatus,
    };
  }

  referral.status = 'qualified';
  referral.qualifiedAt = now;
  referral.referrerRewardStatus = 'qualified';
  referral.referredRewardStatus = 'qualified';
  referral.disqualificationReason = null;

  try {
    const [referrerReward, referredReward] = await Promise.all([
      distributeReferralReward(referral.referrerWallet),
      distributeReferralReward(referral.referredWallet),
    ]);

    if (referrerReward.paid) {
      referral.referrerRewardStatus = 'paid';
      referral.referrerRewardTxHash = referrerReward.txHash;
    }

    if (referredReward.paid) {
      referral.referredRewardStatus = 'paid';
      referral.referredRewardTxHash = referredReward.txHash;
    }

    if (referrerReward.paid && referredReward.paid) {
      referral.rewardedAt = now;
    }
  } catch (error) {
    console.error('[wallet-referrals] Automatic referral payout failed:', error);
  }

  await referral.save();

  return {
    status: referral.status,
    referrerRewardStatus: referral.referrerRewardStatus,
    referredRewardStatus: referral.referredRewardStatus,
    rewardAmount: referral.rewardAmount,
  };
}

router.get('/wallet-referrals/stats', async (req, res) => {
  const wallet = normalizeWallet(req.query.wallet);
  if (!wallet) {
    return res.status(400).json({ error: 'wallet is required' });
  }

  try {
    const referrals = await WalletReferral.findAll({
      where: {
        [Op.or]: [
          { referrerWallet: wallet },
          { referredWallet: wallet },
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    const sentReferrals = referrals.filter((referral) => referral.referrerWallet === wallet);
    const referredBy = referrals.find((referral) => referral.referredWallet === wallet) || null;

    res.json({
      stats: {
        totalRegistered: sentReferrals.length,
        pending: sentReferrals.filter((referral) => referral.status === 'pending').length,
        qualified: sentReferrals.filter((referral) => referral.status === 'qualified').length,
        blocked: sentReferrals.filter((referral) => referral.status === 'blocked').length,
        referrerRewardsPaid: sentReferrals.filter((referral) => referral.referrerRewardStatus === 'paid').length,
      },
      sentReferrals: sentReferrals.slice(0, 10).map((referral) => ({
        id: referral.id,
        referredWallet: referral.referredWallet,
        status: referral.status,
        rewardAmount: referral.rewardAmount,
        referrerRewardStatus: referral.referrerRewardStatus,
        referredRewardStatus: referral.referredRewardStatus,
        qualifiedAt: referral.qualifiedAt,
        createdAt: referral.createdAt,
        disqualificationReason: referral.disqualificationReason,
      })),
      referredBy: referredBy ? {
        id: referredBy.id,
        referrerWallet: referredBy.referrerWallet,
        status: referredBy.status,
        rewardAmount: referredBy.rewardAmount,
        referrerRewardStatus: referredBy.referrerRewardStatus,
        referredRewardStatus: referredBy.referredRewardStatus,
        qualifiedAt: referredBy.qualifiedAt,
        disqualificationReason: referredBy.disqualificationReason,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/wallet-referrals/register', async (req, res) => {
  const referrerWallet = normalizeWallet(req.body.referrerWallet);
  const referredWallet = normalizeWallet(req.body.referredWallet);

  if (!referrerWallet || !referredWallet) {
    return res.status(400).json({ error: 'referrerWallet and referredWallet are required' });
  }

  if (referrerWallet === referredWallet) {
    return res.status(400).json({ error: 'You cannot refer the same wallet.' });
  }

  try {
    const existingClaim = await DailyClaim.findOne({ where: { wallet: referredWallet } });
    if (existingClaim) {
      return res.status(409).json({ error: 'This wallet has already completed its first claim.' });
    }

    const existingReferral = await WalletReferral.findOne({ where: { referredWallet } });
    if (existingReferral) {
      if (existingReferral.referrerWallet === referrerWallet) {
        return res.json({ success: true, existing: true, referral: existingReferral });
      }

      return res.status(409).json({ error: 'A referral is already registered for this wallet.' });
    }

    const referral = await WalletReferral.create({
      referrerWallet,
      referredWallet,
      registrationIp: getRequestIp(req),
    });

    res.json({ success: true, referral });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    // On-chain verification
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || process.env.RPC_URL);
    let receipt;
    try {
      receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return res.status(400).json({ error: 'Transaction not found or failed.' });
      }
    } catch (err) {
      console.error('[mark-paid] Error fetching tx receipt:', err);
      return res.status(500).json({ error: 'Failed to fetch transaction receipt.' });
    }
    // Optionally: decode input data to verify transfer details
    // For now, just log the receipt
    console.log('[mark-paid] Verified on-chain tx:', txHash, 'for claim:', claimId);
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

// GET /api/epwx/daily-claims/summary
router.get('/daily-claims/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayUtc = startOfTodayUtc.toISOString().slice(0, 10);

    const [totalClaimsToday, totalPaidToday] = await Promise.all([
      DailyClaim.count({
        where: {
          claimedAt: { [Op.gte]: startOfTodayUtc },
        },
      }),
      DailyClaim.count({
        where: {
          status: 'paid',
          claimedAt: { [Op.gte]: startOfTodayUtc },
        },
      }),
    ]);

    res.json({ todayUtc, totalClaimsToday, totalPaidToday });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/epwx/daily-claims/mark-paid
router.post('/daily-claims/mark-paid', async (req, res) => {
  const { admin, claimId, txHash, amount } = req.body;
  const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  if (!ADMIN_WALLETS.includes(admin.toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const claim = await DailyClaim.findByPk(claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (amount) {
      claim.amount = String(amount);
    }
    claim.status = 'paid';
    claim.txHash = txHash;
    await claim.save();

    const rewardDetails = findDailyRewardTierByAmount(claim.amount) || await getDailyRewardDetails(claim.wallet);
    const notificationResult = await notifyDailyClaimPaid({
      wallet: claim.wallet,
      amount: claim.amount,
      claimedAt: claim.claimedAt,
      txHash: claim.txHash,
      badgeLabel: rewardDetails.badgeLabel,
      badgeBenefit: rewardDetails.badgeBenefit,
    });

    res.json({
      success: true,
      claim,
      telegramNotified: notificationResult.sent,
      telegramReason: notificationResult.reason,
    });
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
  const normalizedWallet = normalizeWallet(wallet);
  if (!normalizedWallet || !signature) return res.status(400).json({ error: 'wallet and signature are required' });
  const ip = getRequestIp(req);
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
  if (recovered.toLowerCase() !== normalizedWallet) {
    return res.status(401).json({ error: 'Signature does not match wallet' });
  }

  const user = await User.findOne({ where: { walletAddress: normalizedWallet } });
  if (!user || !user.telegramVerified) {
    return res.status(403).json({ error: 'Telegram not verified' });
  }

  const historicalClaim = await DailyClaim.findOne({
    where: { wallet: normalizedWallet },
    order: [['claimedAt', 'ASC']],
  });

  // Check if wallet claimed in last 24h
  const walletClaim = await DailyClaim.findOne({
    where: {
      wallet: normalizedWallet,
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
  const rewardDetails = await getDailyRewardDetails(normalizedWallet);
  const amount = rewardDetails.amount;
  const claim = await DailyClaim.create({ wallet: normalizedWallet, ip, claimedAt: now, amount });

  try {
    const payout = await distributeEpwxReward(normalizedWallet, amount);
    if (payout.paid) {
      claim.status = 'paid';
      claim.txHash = payout.txHash;
      await claim.save();

      const notificationResult = await notifyDailyClaimPaid({
        wallet: claim.wallet,
        amount: claim.amount,
        claimedAt: claim.claimedAt,
        txHash: claim.txHash,
        badgeLabel: rewardDetails.badgeLabel,
        badgeBenefit: rewardDetails.badgeBenefit,
      });

      if (!notificationResult.sent) {
        console.error('[daily-claim] Telegram notification failed:', notificationResult.error || notificationResult.reason);
      }
    }
  } catch (error) {
    console.error('[daily-claim] Automatic daily payout failed:', error);
  }

  let referralReward = null;
  if (!historicalClaim) {
    const referral = await WalletReferral.findOne({ where: { referredWallet: normalizedWallet } });
    referralReward = await qualifyReferralReward({ referral, claim, ip, now });
  }

  res.json({
    success: true,
    message: claim.status === 'paid' ? 'Daily claim successful and paid!' : 'Daily claim successful and queued for payout.',
    amount: claim.amount,
    status: claim.status,
    txHash: claim.txHash || null,
    referralReward,
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

// GET /api/epwx/eligible?wallet=0x...&hours=3
router.get('/eligible', async (req, res) => {
  const { wallet, hours } = req.query;
  if (!wallet) return res.status(400).json({ error: 'wallet is required' });
  const sinceTimestamp = Math.floor(Date.now() / 1000) - ((parseInt(hours) || 3) * 3600);
  try {
    const transactions = await getEPWXPurchaseTransactions(wallet, sinceTimestamp);
    res.json({ transactions });
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

// POST /api/epwx/claims/mark-paid
router.post('/claims/mark-paid', async (req, res) => {
  const { admin, claimId } = req.body;
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase());
  if (!admin || !adminWallets.length || !adminWallets.includes(admin.toLowerCase())) {
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
