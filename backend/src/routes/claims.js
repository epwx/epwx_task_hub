import express from 'express';
import { Claim, Merchant, MerchantClaimCode, SecurityAuthorization, SocialClaimDecisionAudit, SocialClaimVerificationAttempt, TwitterCampaign } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { hashMerchantClaimCode, normalizeMerchantClaimCode } from '../utils/merchantClaimCode.js';
import { notifyMerchantCodeClaimStatus } from '../services/emailNotifications.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { validateAndFingerprintSocialProof, SocialProofValidationError } from '../services/socialProofImage.js';
import { settleApprovedSocialClaims } from '../services/socialClaimAutomation.js';
import rateLimit from 'express-rate-limit';
import {
  createAdminClaimAuthorizationMessage,
  verifyAndConsumeAuthorization,
} from '../utils/signedAuthorization.js';
// Set up admin wallets from environment variable (lowercase, trimmed)
const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase());

// Set up multer storage for receipt images
const uploadDir = path.join(process.cwd(), 'uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });
const socialUpload = multer({
  storage,
  limits: {
    fileSize: Number.parseInt(process.env.SOCIAL_CLAIM_MAX_IMAGE_BYTES || '5242880', 10),
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    callback(null, ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype));
  },
});

const router = express.Router();
const adminClaimActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many administrative claim actions. Please try again later.' },
});
const TWITTER_TASK_TYPE_TO_CLAIM_TYPE = {
  retweet: 'twitter_retweet',
  comment: 'twitter_comment',
  poll: 'twitter_poll',
  rating: 'twitter_rating',
};

function normalizeTwitterTaskType(taskType) {
  const normalized = String(taskType || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(TWITTER_TASK_TYPE_TO_CLAIM_TYPE, normalized) ? normalized : null;
}

function getTwitterClaimType(taskType) {
  return TWITTER_TASK_TYPE_TO_CLAIM_TYPE[taskType] || null;
}

function toUrlPath(filePath) {
  return String(filePath || '').replace(/\\+/g, '/');
}

function isSocialClaim(claim) {
  return String(claim?.claimType || '').startsWith('twitter_');
}

function isEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || 'false').toLowerCase());
}

function toUserSafeSocialClaim(claim) {
  return {
    id: claim.id,
    customer: claim.customer,
    status: claim.status,
    claimType: claim.claimType,
    campaignCode: claim.campaignCode,
    twitterCampaignId: claim.twitterCampaignId,
    verificationStatus: claim.verificationStatus,
    verificationDecision: claim.verificationDecision,
    rejectionComment: claim.rejectionComment,
    payoutStatus: claim.payoutStatus,
    txHash: claim.txHash,
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt,
  };
}

async function removeUploadedFile(file) {
  if (!file?.path) return;
  await fs.promises.unlink(file.path).catch((error) => {
    if (error?.code !== 'ENOENT') throw error;
  });
}



function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/claims/add - Add a new customer claim with receipt image upload
router.post('/add', upload.single('receiptImage'), async (req, res) => {
  const { merchantId, customer, bill, lat, lng } = req.body;
  let receiptImagePath = null;
  if (req.file) {
    // Store relative path for portability
    receiptImagePath = toUrlPath(path.relative(process.cwd(), req.file.path));
  }
  if (!merchantId || !customer || lat == null || lng == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Geofencing: check if user is near merchant
  const merchant = await Merchant.findByPk(merchantId);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }
  const distance = haversineDistance(Number(lat), Number(lng), merchant.latitude, merchant.longitude);
  if (distance > 100) {
    return res.status(403).json({ error: `You must be at the shop to claim. Distance: ${distance.toFixed(1)} meters.` });
  }
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || req.socket?.remoteAddress;
  const now = new Date();
  const since = new Date(now.getTime() - 1 * 60 * 1000); // 1 minute window
  const customerLc = customer.toLowerCase();
  console.log('Claim attempt:', { ip, customer: customerLc });
  try {
    // Restrict by customer (wallet) for 24 hours
    const walletClaim = await Claim.findOne({
      where: {
        customer: customerLc,
        createdAt: { [Op.gte]: since }
      }
    });
    if (walletClaim) {
      const lastClaim = new Date(walletClaim.createdAt);
      const nextClaim = new Date(lastClaim.getTime() + 1 * 60 * 1000); // 1 minute interval
      const msLeft = nextClaim - now;
      if (msLeft > 0) {
        const hours = Math.floor(msLeft / (1000 * 60 * 60));
        const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        console.log('Blocked by wallet:', customerLc, 'Last:', lastClaim);
        return res.status(429).json({ error: `Wallet already claimed. Try again in ${hours}h ${minutes}m.` });
      }
      // else, allow claim
    }
    // Restrict by IP for 24 hours
    const ipClaim = await Claim.findOne({
      where: {
        ip,
        createdAt: { [Op.gte]: since }
      }
    });
    if (ipClaim) {
      const lastClaim = new Date(ipClaim.createdAt);
      const nextClaim = new Date(lastClaim.getTime() + 1 * 60 * 1000); // 1 minute interval
      const msLeft = nextClaim - now;
      const hours = Math.floor(msLeft / (1000 * 60 * 60));
      const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      console.log('Blocked by IP:', ip, 'Last:', lastClaim);
      return res.status(429).json({ error: `IP address already claimed. Try again in ${hours}h ${minutes}m.` });
    }
    // Create claim with IP and receipt image
    const claim = await Claim.create({ merchantId, customer: customerLc, bill, lat, lng, status: 'pending', ip, receiptImage: receiptImagePath });
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/claims/redeem-code - Redeem a fixed-reward merchant purchase code
router.post('/redeem-code', async (req, res) => {
  const { merchantId, customer, email, emailNotificationConsent } = req.body;
  const code = normalizeMerchantClaimCode(req.body.code);
  const customerEmail = String(email || '').trim().toLowerCase();
  if (!merchantId || !customer || !code || !customerEmail) {
    return res.status(400).json({ error: 'Merchant, wallet, email, and claim code are required.' });
  }
  if (customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (emailNotificationConsent !== true) {
    return res.status(400).json({ error: 'Email notification consent is required.' });
  }

  const customerLc = String(customer).trim().toLowerCase();
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  const transaction = await sequelize.transaction();

  try {
    const claimCode = await MerchantClaimCode.findOne({
      where: { merchantId, codeHash: hashMerchantClaimCode(code) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!claimCode) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Invalid claim code.' });
    }
    if (claimCode.status !== 'active') {
      await transaction.rollback();
      return res.status(409).json({ error: 'This claim code has already been used or cancelled.' });
    }
    if (new Date(claimCode.expiresAt).getTime() <= Date.now()) {
      claimCode.status = 'expired';
      await claimCode.save({ transaction });
      await transaction.commit();
      return res.status(410).json({ error: 'This claim code has expired. Ask the cashier for a new code.' });
    }

    const claim = await Claim.create({
      merchantId: claimCode.merchantId,
      merchantClaimCodeId: claimCode.id,
      customer: customerLc,
      customerEmail,
      emailNotificationConsent: true,
      bill: claimCode.rewardAmount,
      claimType: 'merchant_code',
      status: 'pending',
      ip,
    }, { transaction });

    claimCode.status = 'redeemed';
    claimCode.redeemedAt = new Date();
    claimCode.redeemedBy = customerLc;
    await claimCode.save({ transaction });
    await transaction.commit();

    await notifyMerchantCodeClaimStatus(claim, 'pending');
    return res.status(201).json({
      success: true,
      claim: { id: claim.id, merchantId: claim.merchantId, status: claim.status },
      rewardAmount: claimCode.rewardAmount,
    });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/claims - List claims
// - If merchantId is provided, return claims for that merchant (view-only, no admin required)
// - If admin is provided, return all claims (optionally filter by status)
router.get('/', async (req, res) => {
  const { admin, status, merchantId, claimType } = req.query;
  try {
    let where = {};
    if (merchantId) {
      where = { merchantId };
    } else if (admin && adminWallets.includes(admin.toLowerCase())) {
      if (status) where = { status };
      if (claimType) {
        where = { ...where, claimType: String(claimType).trim() };
      }
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const claims = await Claim.findAll({
      where,
      attributes: { exclude: ['customerEmail', 'emailNotificationConsent', 'lastEmailNotificationStatus'] },
      include: admin && adminWallets.includes(String(admin).toLowerCase()) ? [
        {
          model: SocialClaimVerificationAttempt,
          as: 'verificationAttemptsHistory',
          required: false,
          separate: true,
          order: [['attemptNumber', 'DESC']],
        },
        {
          model: SocialClaimDecisionAudit,
          as: 'decisionAudits',
          required: false,
          separate: true,
          order: [['createdAt', 'DESC']],
        },
      ] : [],
      order: [['createdAt', 'DESC']],
    });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function createTwitterCampaignClaim(req, res, expectedTaskType) {
  const { customer, twitterCampaignId, twitterUsername } = req.body;
  let receiptImagePath = null;

  if (req.file) {
    receiptImagePath = toUrlPath(path.relative(process.cwd(), req.file.path));
  }

  if (!customer || !twitterCampaignId || !req.file) {
    return res.status(400).json({ error: 'Customer wallet, campaign, and screenshot are required.' });
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(String(customer).trim())) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ error: 'A valid customer wallet is required.' });
  }

  const campaignId = Number.parseInt(String(twitterCampaignId), 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return res.status(400).json({ error: 'Invalid social campaign.' });
  }

  const normalizedTaskType = normalizeTwitterTaskType(expectedTaskType);
  if (!normalizedTaskType) {
    return res.status(400).json({ error: 'Invalid Twitter task type.' });
  }

  try {
    let proof;
    try {
      proof = await validateAndFingerprintSocialProof(req.file.path);
    } catch (error) {
      await removeUploadedFile(req.file);
      if (error instanceof SocialProofValidationError) {
        return res.status(400).json({ error: error.message, code: error.code });
      }
      throw error;
    }

    const campaign = await TwitterCampaign.findByPk(campaignId);
    if (!campaign || !campaign.isActive) {
      await removeUploadedFile(req.file);
      return res.status(404).json({ error: 'Campaign not found or inactive.' });
    }

    if (campaign.taskType !== normalizedTaskType) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: 'Campaign task type does not match this claim route.' });
    }

    if (campaign.expiresAt && new Date(campaign.expiresAt) < new Date()) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: 'Campaign has expired.' });
    }

    const customerLc = String(customer).trim().toLowerCase();
    const normalizedTwitterUsername = twitterUsername ? String(twitterUsername).trim().replace(/^@/, '') : null;
    if (normalizedTwitterUsername && !/^[A-Za-z0-9_]{1,15}$/.test(normalizedTwitterUsername)) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: 'Enter a valid social username.' });
    }
    const claimType = getTwitterClaimType(normalizedTaskType);
    const existingClaim = await Claim.findOne({
      where: {
        customer: customerLc,
        twitterCampaignId: campaign.id,
        claimType,
        status: { [Op.in]: ['pending', 'approved', 'paid'] },
      },
      order: [['createdAt', 'DESC']],
    });

    if (existingClaim) {
      await removeUploadedFile(req.file);
      return res.status(409).json({ error: existingClaim.status === 'paid' ? 'Campaign reward already paid.' : 'You already submitted this campaign for review.' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const claim = await Claim.create({
      customer: customerLc,
      bill: campaign.rewardAmount,
      claimType,
      campaignCode: campaign.code,
      twitterCampaignId: campaign.id,
      twitterUsername: normalizedTwitterUsername,
      status: 'pending',
      ip,
      receiptImage: receiptImagePath,
      verificationStatus: isEnabled(process.env.SOCIAL_CLAIM_AUTO_VERIFICATION_ENABLED) ? 'queued' : 'manual_review',
      verificationDecision: isEnabled(process.env.SOCIAL_CLAIM_AUTO_VERIFICATION_ENABLED) ? null : 'manual_review',
      proofSha256: proof.proofSha256,
      proofPerceptualHash: proof.proofPerceptualHash,
    });

    return res.json({ success: true, claim: toUserSafeSocialClaim(claim) });
  } catch (err) {
    await removeUploadedFile(req.file);
    return res.status(500).json({ error: err.message });
  }
}

function handleSocialClaimUpload(taskType) {
  return (req, res) => {
    socialUpload.single('receiptImage')(req, res, async (error) => {
      if (error) {
        const message = error.code === 'LIMIT_FILE_SIZE'
          ? 'Screenshot exceeds the allowed file size.'
          : 'Screenshot upload could not be processed.';
        return res.status(400).json({ error: message, code: error.code || 'INVALID_UPLOAD' });
      }
      return createTwitterCampaignClaim(req, res, taskType);
    });
  };
}

router.post('/twitter-retweet', handleSocialClaimUpload('retweet'));
router.post('/twitter-comment', handleSocialClaimUpload('comment'));
router.post('/twitter-poll', handleSocialClaimUpload('poll'));
router.post('/twitter-rating', handleSocialClaimUpload('rating'));

// POST /api/claims/:id/mark-status - Update claim status (admin only)
router.post('/:id/mark-status', adminClaimActionLimiter, async (req, res) => {
  const { status, rejectionComment, overrideReason, authorization } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid claim status.' });
  }
  try {
    const reason = String(overrideReason || rejectionComment || '').trim();
    const authorizationMessage = createAdminClaimAuthorizationMessage({
      wallet: authorization?.wallet,
      claimId: req.params.id,
      action: 'mark-status',
      status,
      reason,
      issuedAt: authorization?.issuedAt,
      nonce: authorization?.nonce,
    });
    const authorizationResult = await verifyAndConsumeAuthorization({
      authorization,
      expectedWallet: authorization?.wallet,
      purpose: `claim:${req.params.id}:mark-status`,
      message: authorizationMessage,
      allowedWallets: adminWallets,
      authorizationModel: SecurityAuthorization,
    });
    if (!authorizationResult.ok) {
      return res.status(authorizationResult.status).json({ error: authorizationResult.error });
    }
    const admin = authorizationResult.wallet;

    const claim = await Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status === 'paid') {
      return res.status(409).json({ error: 'Paid claims cannot be changed.' });
    }
    if (isSocialClaim(claim) && !String(overrideReason || rejectionComment || '').trim()) {
      return res.status(400).json({ error: 'An override reason is required for social claims.' });
    }
    const previousDecision = claim.verificationDecision || claim.status;
    claim.status = status;
    if (status === 'rejected') {
      claim.rejectionComment = rejectionComment || null;
    } else {
      claim.rejectionComment = null;
    }
    if (isSocialClaim(claim)) {
      claim.verificationDecision = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'manual_review';
      claim.verificationStatus = 'completed';
      claim.verificationCompletedAt = new Date();
      claim.approvedAt = status === 'approved' ? new Date() : null;
      claim.approvedBy = status === 'approved' ? String(admin).toLowerCase() : null;
      claim.payoutStatus = status === 'approved' ? 'pending' : claim.payoutStatus;
    }
    await claim.save();
    if (isSocialClaim(claim)) {
      await SocialClaimDecisionAudit.create({
        claimId: claim.id,
        actor: String(admin).toLowerCase(),
        previousDecision,
        nextDecision: claim.verificationDecision,
        reason: String(overrideReason || rejectionComment).trim(),
      });
    }
    await notifyMerchantCodeClaimStatus(claim, status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/settle', adminClaimActionLimiter, async (req, res) => {
  try {
    const { authorization } = req.body;
    const authorizationMessage = createAdminClaimAuthorizationMessage({
      wallet: authorization?.wallet,
      claimId: req.params.id,
      action: 'settle',
      issuedAt: authorization?.issuedAt,
      nonce: authorization?.nonce,
    });
    const authorizationResult = await verifyAndConsumeAuthorization({
      authorization,
      expectedWallet: authorization?.wallet,
      purpose: `claim:${req.params.id}:settle`,
      message: authorizationMessage,
      allowedWallets: adminWallets,
      authorizationModel: SecurityAuthorization,
    });
    if (!authorizationResult.ok) {
      return res.status(authorizationResult.status).json({ error: authorizationResult.error });
    }

    const claim = await Claim.findByPk(req.params.id);
    if (!claim || !isSocialClaim(claim)) {
      return res.status(404).json({ error: 'Social engagement claim not found.' });
    }
    if (claim.status === 'paid') {
      return res.status(409).json({ error: 'Claim is already paid.' });
    }
    if (claim.status !== 'approved') {
      return res.status(409).json({ error: 'Claim must be approved before settlement.' });
    }

    const result = await settleApprovedSocialClaims({ force: true, claimId: claim.id });
    if (!result.paid) {
      return res.status(502).json({ error: 'Claim settlement did not complete.', result });
    }
    return res.json({ success: true, result });
  } catch (error) {
    console.error('Settle social claim error:', error);
    return res.status(500).json({ error: 'Failed to settle claim.' });
  }
});

export default router;
