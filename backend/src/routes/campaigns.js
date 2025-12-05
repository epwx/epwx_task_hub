const express = require('express');
const router = express.Router();
const { Campaign, User } = require('../models');
const { authenticateToken } = require('./auth');

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
    
    // Create campaign in database
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
    
    res.json({
      success: true,
      data: campaign,
      message: 'Campaign created. Please complete the blockchain transaction.'
    });
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

module.exports = router;
