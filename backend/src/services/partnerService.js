import { Partner, PartnerReferral, PartnerEarning, User } from '../models/index.js';
import { randomBytes } from 'crypto';
import { Op, fn, col } from 'sequelize';

/**
 * Generate a unique referral code
 */
export async function generateReferralCode() {
  let code;
  let exists = true;
  while (exists) {
    code = randomBytes(8).toString('hex').toUpperCase();
    const existing = await PartnerReferral.findOne({ where: { referralCode: code } });
    exists = !!existing;
  }
  return code;
}

/**
 * Register a new partner with verification image
 */
export async function registerPartner(partnerData) {
  const { name, walletAddress, telegramChannel, xProfile, verificationImagePath } = partnerData;

  // Check if partner already exists
  const existing = await Partner.findOne({ where: { walletAddress: walletAddress.toLowerCase() } });
  if (existing) {
    throw new Error('Partner already registered with this wallet');
  }

  // Check if name is already taken
  const nameExists = await Partner.findOne({ where: { name } });
  if (nameExists) {
    throw new Error('Partner name already exists');
  }

  // Validate wallet address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error('Invalid wallet address format');
  }

  // Verification image is required
  if (!verificationImagePath) {
    throw new Error('Twitter followers screenshot is required for verification');
  }

  const partner = await Partner.create({
    name,
    walletAddress: walletAddress.toLowerCase(),
    telegramChannel,
    xProfile,
    verificationImagePath,
    status: 'pending'  // Always start as pending
  });

  return partner;
}

/**
 * Create a referral link for a partner and user
 */
export async function createPartnerReferral(partnerId, userId) {
  // Check if referral already exists for this user and partner
  const existing = await PartnerReferral.findOne({
    where: { partnerId, userId }
  });

  if (existing) {
    return existing;
  }

  const referralCode = await generateReferralCode();
  const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/claim?partner=${referralCode}`;

  const referral = await PartnerReferral.create({
    partnerId,
    userId,
    referralCode,
    referralLink
  });

  return referral;
}

/**
 * Get or create a referral by code
 */
export async function getReferralByCode(referralCode) {
  const referral = await PartnerReferral.findOne({
    where: { referralCode },
    include: [
      { model: Partner, as: 'partner' },
      { model: User, as: 'user' }
    ]
  });

  return referral;
}

/**
 * Calculate cycle number based on first claim date
 */
export function calculateCycleNumber(firstClaimDate) {
  if (!firstClaimDate) return null;
  const now = new Date();
  const daysSinceFirstClaim = Math.floor((now - new Date(firstClaimDate)) / (1000 * 60 * 60 * 24));
  return Math.floor(daysSinceFirstClaim / 30);
}

/**
 * Record partner earning for a verified daily claim
 */
export async function recordPartnerEarning(partnerId, userId, referralId, claimDate) {
  const referral = await PartnerReferral.findByPk(referralId);
  
  if (!referral || referral.partnerId !== partnerId || referral.userId !== userId) {
    throw new Error('Invalid referral relationship');
  }

  // Check if partner is approved
  const partner = await Partner.findByPk(partnerId);
  if (!partner || partner.status !== 'approved') {
    throw new Error('Partner is not approved for earnings');
  }

  // Update first claim date if this is the first claim
  if (!referral.firstClaimDate) {
    referral.firstClaimDate = claimDate;
  }

  referral.lastClaimDate = claimDate;
  referral.totalClaimsEarned += 1;

  // Calculate cycle number
  const cycleNumber = calculateCycleNumber(referral.firstClaimDate);

  // Create earning record
  const earning = await PartnerEarning.create({
    partnerId,
    userId,
    referralId,
    claimDate,
    cycleNumber,
    amount: '100000000000', // 100,000 EPWX in smallest unit
    status: 'pending'
  });

  // Update referral totals
  referral.totalPartnerEarnings = BigInt(referral.totalPartnerEarnings || 0) + BigInt(earning.amount);
  await referral.save();

  // Update partner totals
  partner.totalEarnings = BigInt(partner.totalEarnings || 0) + BigInt(earning.amount);
  partner.totalReferredUsers = await PartnerReferral.count({ where: { partnerId } });
  await partner.save();

  return earning;
}

/**
 * Get partner dashboard stats
 */
export async function getPartnerStats(partnerId) {
  const partner = await Partner.findByPk(partnerId, {
    include: [
      { model: PartnerReferral, as: 'referrals' }
    ]
  });

  if (!partner) {
    throw new Error('Partner not found');
  }

  // Get earnings by status
  const earnings = await PartnerEarning.findAll({
    where: { partnerId },
    attributes: ['status', [fn('sum', col('amount')), 'totalAmount']],
    group: ['status']
  });

  const earningsByStatus = {};
  earnings.forEach(e => {
    earningsByStatus[e.status] = e.dataValues.totalAmount || 0;
  });

  // Get total verified claims
  const totalVerifiedClaims = await PartnerEarning.count({
    where: { partnerId, status: 'completed' }
  });

  // Get active users (users with claims in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = await PartnerEarning.count({
    distinct: true,
    col: 'userId',
    where: {
      partnerId,
      claimDate: { [Op.gte]: thirtyDaysAgo }
    }
  });

  return {
    partner,
    totalReferrals: partner.referrals.length,
    totalEarnings: partner.totalEarnings,
    pendingEarnings: earningsByStatus['pending'] || 0,
    completedEarnings: earningsByStatus['completed'] || 0,
    totalVerifiedClaims,
    activeUsersLast30Days: activeUsers
  };
}

/**
 * Get partner earnings history
 */
export async function getPartnerEarningsHistory(partnerId, limit = 50, offset = 0) {
  const earnings = await PartnerEarning.findAndCountAll({
    where: { partnerId },
    include: [
      { model: User, as: 'user' },
      { model: PartnerReferral, as: 'referral' }
    ],
    order: [['claimDate', 'DESC']],
    limit,
    offset
  });

  return earnings;
}

/**
 * Update partner earning status (after verification/settlement)
 */
export async function updatePartnerEarningStatus(earningId, status, transactionHash = null) {
  const earning = await PartnerEarning.findByPk(earningId);
  
  if (!earning) {
    throw new Error('Earning record not found');
  }

  earning.status = status;
  if (transactionHash) {
    earning.transactionHash = transactionHash;
  }

  await earning.save();
  return earning;
}

/**
 * Get pending earnings ready for settlement
 */
export async function getPendingEarningsForSettlement(hoursOld = 24) {
  const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

  const earnings = await PartnerEarning.findAll({
    where: {
      status: 'pending',
      createdAt: { [Op.lte]: cutoffDate }
    },
    include: [
      { model: Partner, as: 'partner' },
      { model: User, as: 'user' }
    ],
    order: [['createdAt', 'ASC']]
  });

  return earnings;
}

/**
 * Get all partners (for admin dashboard)
 */
export async function getAllPartners(status = null) {
  const where = {};
  if (status) {
    where.status = status;
  }

  const partners = await Partner.findAll({
    where,
    include: [
      { model: PartnerReferral, as: 'referrals' }
    ],
    order: [['createdAt', 'DESC']]
  });

  return partners;
}

/**
 * Get pending partners for admin approval
 */
export async function getPendingPartners() {
  const partners = await Partner.findAll({
    where: { status: 'pending' },
    order: [['createdAt', 'ASC']]
  });
  return partners;
}

/**
 * Approve a partner (admin only)
 */
export async function approvePartner(partnerId, adminWallet) {
  const partner = await Partner.findByPk(partnerId);
  
  if (!partner) {
    throw new Error('Partner not found');
  }

  if (partner.status !== 'pending') {
    throw new Error('Only pending partners can be approved');
  }

  partner.status = 'approved';
  partner.approvedAt = new Date();
  partner.approvedBy = adminWallet;
  await partner.save();

  return partner;
}

/**
 * Reject a partner (admin only)
 */
export async function rejectPartner(partnerId, adminWallet, reason) {
  const partner = await Partner.findByPk(partnerId);
  
  if (!partner) {
    throw new Error('Partner not found');
  }

  if (partner.status !== 'pending') {
    throw new Error('Only pending partners can be rejected');
  }

  partner.status = 'rejected';
  partner.rejectionReason = reason;
  partner.approvedBy = adminWallet;
  partner.approvedAt = new Date();
  await partner.save();

  return partner;
}

/**
 * Check if partner is approved (for earning eligibility)
 */
export async function isPartnerApproved(partnerId) {
  const partner = await Partner.findByPk(partnerId);
  if (!partner) return false;
  return partner.status === 'approved';
}
