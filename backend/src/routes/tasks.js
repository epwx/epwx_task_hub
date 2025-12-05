const express = require('express');
const router = express.Router();
const { TaskSubmission, Campaign, User } = require('../models');
const { authenticateToken } = require('./auth');
const { taskManagerWithSigner } = require('../services/blockchain');

/**
 * POST /api/tasks/submit
 * Submit a task completion
 */
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { campaignId, proofUrl } = req.body;
    
    if (!campaignId || !proofUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign || campaign.status !== 'active') {
      return res.status(400).json({ error: 'Campaign not available' });
    }
    
    // Check if user already submitted for this campaign
    const existing = await TaskSubmission.findOne({
      where: {
        campaignId,
        userId: req.user.userId
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Already submitted for this campaign' });
    }
    
    // Create submission
    const submission = await TaskSubmission.create({
      campaignId,
      userId: req.user.userId,
      proofUrl,
      status: 'pending',
      rewardAmount: campaign.rewardPerTask
    });
    
    res.json({
      success: true,
      data: submission,
      message: 'Task submitted for verification'
    });
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

/**
 * GET /api/tasks/user
 * Get user's task submissions
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const submissions = await TaskSubmission.findAll({
      where: { userId: req.user.userId },
      include: [{
        model: Campaign,
        as: 'campaign',
        attributes: ['title', 'taskType', 'rewardPerTask']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * GET /api/tasks/pending
 * Get pending submissions for verification (admin only)
 */
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you can add proper role checking)
    const user = await User.findByPk(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const submissions = await TaskSubmission.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['title', 'taskType', 'targetUrl']
        },
        {
          model: User,
          as: 'user',
          attributes: ['walletAddress', 'twitterUsername']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: 100
    });
    
    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
});

module.exports = router;
