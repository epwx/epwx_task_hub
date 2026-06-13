import express from 'express';
import { Op } from 'sequelize';
import { Claim, TwitterCampaign } from '../models/index.js';

const router = express.Router();
const FIXED_TWITTER_REWARD_AMOUNT = '100000';

function getAdminWallets() {
  return (process.env.ADMIN_WALLETS || '').split(',').map(wallet => wallet.trim().toLowerCase()).filter(Boolean);
}

function requireAdmin(req, res, next) {
  const admin = req.headers['x-admin-wallet'] || req.body.admin || req.query.admin;
  const adminWallets = getAdminWallets();

  if (!admin || !adminWallets.includes(String(admin).toLowerCase())) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  next();
}

function isCampaignExpired(campaign) {
  return !!campaign.expiresAt && new Date(campaign.expiresAt) < new Date();
}

function normalizeExpiresAt(expiresAt) {
  if (!expiresAt) return null;

  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

async function getWalletClaimStatusByCampaignId(wallet) {
  if (!wallet) {
    return new Map();
  }

  const claimedCampaigns = await Claim.findAll({
    attributes: ['twitterCampaignId', 'status'],
    where: {
      customer: wallet,
      claimType: 'twitter_retweet',
      twitterCampaignId: { [Op.ne]: null },
      status: { [Op.in]: ['pending', 'paid'] },
    },
    order: [['createdAt', 'DESC']],
  });

  return new Map(
    claimedCampaigns
      .map(claim => [claim.twitterCampaignId, claim.status])
      .filter(([campaignId]) => Number.isInteger(campaignId))
  );
}

router.post('/add', requireAdmin, async (req, res) => {
  const { code, title, tweetUrl, expiresAt } = req.body;

  if (!code || !title || !tweetUrl) {
    return res.status(400).json({ error: 'Code, title, and tweet URL are required.' });
  }

  try {
    const normalizedExpiresAt = normalizeExpiresAt(expiresAt);
    if (normalizedExpiresAt === undefined) {
      return res.status(400).json({ error: 'Invalid expiry date.' });
    }

    const campaign = await TwitterCampaign.create({
      code: String(code).trim().toLowerCase(),
      title: String(title).trim(),
      tweetUrl: String(tweetUrl).trim(),
      rewardAmount: FIXED_TWITTER_REWARD_AMOUNT,
      expiresAt: normalizedExpiresAt,
      isActive: true,
    });

    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', requireAdmin, async (req, res) => {
  try {
    const requestedPage = parsePositiveInteger(req.query.page, 1);
    const limit = Math.min(parsePositiveInteger(req.query.limit, 10), 100);
    const total = await TwitterCampaign.count();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * limit;

    const campaigns = await TwitterCampaign.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const wallet = typeof req.query.wallet === 'string' ? req.query.wallet.trim().toLowerCase() : '';
    const campaigns = await TwitterCampaign.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    });

    const claimStatusByCampaignId = await getWalletClaimStatusByCampaignId(wallet);

    const activeCampaigns = campaigns
      .filter(campaign => {
        const claimStatus = claimStatusByCampaignId.get(campaign.id);

        if (claimStatus === 'pending') {
          return true;
        }

        if (claimStatus === 'paid') {
          return false;
        }

        return !isCampaignExpired(campaign);
      })
      .map(campaign => ({
        id: campaign.id,
        code: campaign.code,
        title: campaign.title,
        tweetUrl: campaign.tweetUrl,
        rewardAmount: campaign.rewardAmount,
        expiresAt: campaign.expiresAt,
        claimStatus: claimStatusByCampaignId.get(campaign.id) || null,
      }));

    res.json({ campaigns: activeCampaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const campaign = await TwitterCampaign.findByPk(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const { code, title, tweetUrl, expiresAt, isActive } = req.body;
    const normalizedExpiresAt = expiresAt !== undefined ? normalizeExpiresAt(expiresAt) : campaign.expiresAt;

    if (normalizedExpiresAt === undefined) {
      return res.status(400).json({ error: 'Invalid expiry date.' });
    }

    if (code !== undefined) campaign.code = String(code).trim().toLowerCase();
    if (title !== undefined) campaign.title = String(title).trim();
    if (tweetUrl !== undefined) campaign.tweetUrl = String(tweetUrl).trim();
    campaign.rewardAmount = FIXED_TWITTER_REWARD_AMOUNT;
    if (expiresAt !== undefined) campaign.expiresAt = normalizedExpiresAt;
    if (isActive !== undefined) campaign.isActive = Boolean(isActive);

    await campaign.save();
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaign = await TwitterCampaign.findByPk(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const wallet = typeof req.query.wallet === 'string' ? req.query.wallet.trim().toLowerCase() : '';
    const claimStatusByCampaignId = await getWalletClaimStatusByCampaignId(wallet);
    const claimStatus = claimStatusByCampaignId.get(campaign.id) || null;

    if ((!campaign.isActive || isCampaignExpired(campaign)) && claimStatus !== 'pending') {
      return res.status(404).json({ error: 'Campaign is inactive or expired' });
    }

    res.json({
      id: campaign.id,
      code: campaign.code,
      title: campaign.title,
      tweetUrl: campaign.tweetUrl,
      rewardAmount: campaign.rewardAmount,
      expiresAt: campaign.expiresAt,
      claimStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;