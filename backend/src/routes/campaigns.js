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
