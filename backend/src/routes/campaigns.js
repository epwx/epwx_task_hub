import express from 'express';
import { Campaign, User } from '../models/index.js';
import { authenticateToken } from './auth.js';
import { createCampaignOnChain } from '../services/campaignOnChain.js';
const router = express.Router();

/**
 * GET /api/campaigns
 * Get all active campaigns
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'active', taskType, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (taskType) where.taskType = taskType;
    
    const campaigns = await Campaign.findAll({
      where,
      include: [{
        model: User,
        as: 'advertiser',
        attributes: ['walletAddress', 'reputationScore']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'advertiser',
        attributes: ['walletAddress']
      }]
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

/**
 * POST /api/campaigns
 * Create new campaign (requires authentication)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      taskType,
      targetUrl,
      rewardPerTask,
      maxCompletions,
      durationInDays
    } = req.body;
    
    // Validation
    if (!title || !taskType || !targetUrl || !rewardPerTask || !maxCompletions || !durationInDays) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const totalBudget = BigInt(rewardPerTask) * BigInt(maxCompletions);
    const deadline = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);
    
    // 1. Create campaign in DB with pending status
    const campaign = await Campaign.create({
      campaignId: 0, // Will be updated after blockchain transaction
      advertiserId: req.user.userId,
      title,
      description,
      taskType,
      targetUrl,
      rewardPerTask: rewardPerTask.toString(),
      maxCompletions,
      totalBudget: totalBudget.toString(),
      deadline,
      status: 'pending'
    });

    // 2. Create campaign on blockchain
    try {
      const onChain = await createCampaignOnChain(
        taskType,
        targetUrl,
        rewardPerTask.toString(),
        maxCompletions,
        durationInDays
      );
      // 3. Update DB with blockchain campaignId and tx hash
      campaign.campaignId = onChain.campaignId;
      campaign.transactionHash = onChain.transactionHash;
      campaign.status = 'active';
      await campaign.save();
      res.json({
        success: true,
        data: campaign,
        message: 'Campaign created successfully on blockchain.'
      });
    } catch (err) {
      // If blockchain tx fails, keep DB record as pending
      res.status(500).json({ error: 'Blockchain transaction failed', details: err.message });
    }
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * GET /api/campaigns/user/:walletAddress
 * Get campaigns by advertiser
 */
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { walletAddress: req.params.walletAddress.toLowerCase() }
    });
    
    if (!user) {
      return res.json({ success: true, data: [] });
    }
    
    const campaigns = await Campaign.findAll({
      where: { advertiserId: user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user campaigns' });
  }
});

export default router;
