// DEBUG: Print admin wallets env variable on backend startup
console.log('BACKEND ENV ADMIN_WALLETS:', process.env.ADMIN_WALLETS);


import express from 'express';
import { Claim, Merchant, TwitterCampaign } from '../models/index.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

const router = express.Router();
const TWITTER_TASK_TYPE_TO_CLAIM_TYPE = {
  retweet: 'twitter_retweet',
  comment: 'twitter_comment',
  poll: 'twitter_poll',
};

function normalizeTwitterTaskType(taskType) {
  const normalized = String(taskType || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(TWITTER_TASK_TYPE_TO_CLAIM_TYPE, normalized) ? normalized : null;
}

function getTwitterClaimType(taskType) {
  return TWITTER_TASK_TYPE_TO_CLAIM_TYPE[taskType] || null;
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
    receiptImagePath = path.relative(process.cwd(), req.file.path);
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
    const claims = await Claim.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function createTwitterCampaignClaim(req, res, expectedTaskType) {
  const { customer, twitterCampaignId, twitterUsername } = req.body;
  let receiptImagePath = null;

  if (req.file) {
    receiptImagePath = path.relative(process.cwd(), req.file.path);
  }

  if (!customer || !twitterCampaignId || !req.file) {
    return res.status(400).json({ error: 'Customer wallet, campaign, and screenshot are required.' });
  }

  const campaignId = Number.parseInt(String(twitterCampaignId), 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return res.status(400).json({ error: 'Invalid Twitter campaign.' });
  }

  const normalizedTaskType = normalizeTwitterTaskType(expectedTaskType);
  if (!normalizedTaskType) {
    return res.status(400).json({ error: 'Invalid Twitter task type.' });
  }

  try {
    const campaign = await TwitterCampaign.findByPk(campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ error: 'Campaign not found or inactive.' });
    }

    if (campaign.taskType !== normalizedTaskType) {
      return res.status(400).json({ error: 'Campaign task type does not match this claim route.' });
    }

    if (campaign.expiresAt && new Date(campaign.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Campaign has expired.' });
    }

    const customerLc = String(customer).trim().toLowerCase();
    const claimType = getTwitterClaimType(normalizedTaskType);
    const existingClaim = await Claim.findOne({
      where: {
        customer: customerLc,
        twitterCampaignId: campaign.id,
        claimType,
        status: { [Op.in]: ['pending', 'paid'] },
      },
      order: [['createdAt', 'DESC']],
    });

    if (existingClaim) {
      return res.status(409).json({ error: existingClaim.status === 'paid' ? 'Campaign reward already paid.' : 'You already submitted this campaign for review.' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const claim = await Claim.create({
      customer: customerLc,
      bill: campaign.rewardAmount,
      claimType,
      campaignCode: campaign.code,
      twitterCampaignId: campaign.id,
      twitterUsername: twitterUsername ? String(twitterUsername).trim().replace(/^@/, '') : null,
      status: 'pending',
      ip,
      receiptImage: receiptImagePath,
    });

    return res.json({ success: true, claim });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

const xEngagementProgramPaused = (_req, res) => {
  return res.status(410).json({
    error: 'X engagement claims are paused. Use daily claim programs instead.',
    code: 'X_ENGAGEMENT_PAUSED',
  });
};

router.post('/twitter-retweet', upload.single('receiptImage'), xEngagementProgramPaused);
router.post('/twitter-comment', upload.single('receiptImage'), xEngagementProgramPaused);
router.post('/twitter-poll', upload.single('receiptImage'), xEngagementProgramPaused);

// POST /api/claims/:id/mark-status - Update claim status (admin only)
router.post('/:id/mark-status', async (req, res) => {
  const { admin, status, rejectionComment } = req.body;
  if (!admin || !adminWallets.length || !adminWallets.includes(admin.toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    const claim = await Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    claim.status = status;
    if (status === 'rejected') {
      claim.rejectionComment = rejectionComment || null;
    } else {
      claim.rejectionComment = null;
    }
    await claim.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
