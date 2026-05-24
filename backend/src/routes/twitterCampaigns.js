import express from 'express';
import { TwitterCampaign } from '../models/index.js';

const router = express.Router();

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

router.post('/add', requireAdmin, async (req, res) => {
  const { code, title, tweetUrl, rewardAmount, expiresAt } = req.body;

  if (!code || !title || !tweetUrl) {
    return res.status(400).json({ error: 'Code, title, and tweet URL are required.' });
  }

  try {
    const campaign = await TwitterCampaign.create({
      code: String(code).trim().toLowerCase(),
      title: String(title).trim(),
      tweetUrl: String(tweetUrl).trim(),
      rewardAmount: rewardAmount ? String(rewardAmount).trim() : '100000',
      expiresAt: expiresAt || null,
      isActive: true,
    });

    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', requireAdmin, async (req, res) => {
  try {
    const campaigns = await TwitterCampaign.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ campaigns });
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

    const { code, title, tweetUrl, rewardAmount, expiresAt, isActive } = req.body;

    if (code !== undefined) campaign.code = String(code).trim().toLowerCase();
    if (title !== undefined) campaign.title = String(title).trim();
    if (tweetUrl !== undefined) campaign.tweetUrl = String(tweetUrl).trim();
    if (rewardAmount !== undefined) campaign.rewardAmount = String(rewardAmount).trim();
    if (expiresAt !== undefined) campaign.expiresAt = expiresAt || null;
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

    if (!campaign.isActive || isCampaignExpired(campaign)) {
      return res.status(404).json({ error: 'Campaign is inactive or expired' });
    }

    res.json({
      id: campaign.id,
      code: campaign.code,
      title: campaign.title,
      tweetUrl: campaign.tweetUrl,
      rewardAmount: campaign.rewardAmount,
      expiresAt: campaign.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;