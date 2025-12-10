const express = require('express');
const router = express.Router();
const { TaskSubmission, Campaign, User } = require('../models');
const { authenticateToken } = require('./auth');
const { taskManagerWithSigner } = require('../services/blockchain');
const twitterVerification = require('../services/twitterVerification');
const { ethers } = require('ethers');

/**
 * POST /api/tasks/submit
 * Submit a task completion with automatic Twitter verification
 */
router.post('/submit', async (req, res) => {
  try {
    const { campaignId, twitterUsername, walletAddress } = req.body;
    const userAddress = walletAddress;
    
    console.log('[Task Submit] Request:', { campaignId, twitterUsername, walletAddress });
    
    if (!campaignId || !twitterUsername) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!userAddress) {
      return res.status(400).json({ error: 'Wallet address not found' });
    }
    
    // ===== NEW: Verify Twitter ownership =====
    const user = await User.findOne({ where: { walletAddress: userAddress } });
    
    if (!user || !user.twitterUsername) {
      return res.status(403).json({ 
        error: 'Please connect your X/Twitter account first',
        success: false,
        requiresTwitterAuth: true
      });
    }
    
    // Normalize usernames for comparison (remove @ if present)
    const normalizedSubmitted = twitterUsername.replace('@', '').toLowerCase();
    const normalizedVerified = user.twitterUsername.replace('@', '').toLowerCase();
    
    if (normalizedSubmitted !== normalizedVerified) {
      return res.status(403).json({ 
        error: `You can only submit tasks using your verified X account: @${user.twitterUsername}`,
        success: false,
        verifiedUsername: user.twitterUsername
      });
    }
    // ===== End Twitter ownership check =====
    
    console.log('[Task Submit] Fetching campaign from blockchain, ID:', campaignId);
    console.log('[Task Submit] Contract address:', process.env.TASK_MANAGER_CONTRACT);
    console.log('[Task Submit] RPC URL:', process.env.BASE_RPC_URL);
    
    // Fetch campaign from blockchain
    let campaign;
    try {
      campaign = await taskManagerWithSigner.campaigns(campaignId);
      console.log('[Task Submit] Campaign data:', campaign);
      console.log('[Task Submit] Campaign advertiser:', campaign.advertiser);
      console.log('[Task Submit] Campaign active:', campaign.active);
    } catch (error) {
      console.error('[Task Submit] Campaign fetch error:', error.message);
      console.error('[Task Submit] Full error:', error);
      return res.status(404).json({ 
        error: `Campaign #${campaignId} not found on blockchain. Please verify the campaign ID.`,
        success: false 
      });
    }
    
    if (!campaign.active) {
      return res.status(400).json({ error: 'Campaign not active' });
    }
    
    // Check if user already completed this campaign on blockchain
    const hasCompleted = await taskManagerWithSigner.hasCompleted(campaignId, userAddress);
    if (hasCompleted) {
      return res.status(400).json({ error: 'You already completed this campaign' });
    }
    
    // Verify task via Twitter API
    const verification = await twitterVerification.verifyTask(
      campaign.taskType,
      user.twitterUsername, // Use verified username from DB
      campaign.targetUrl
    );
    
    if (!verification.verified) {
      return res.status(400).json({ 
        error: verification.message || 'Task verification failed',
        success: false
      });
    }
    
    // Submit completion to blockchain
    const tx = await taskManagerWithSigner.submitCompletion(campaignId, userAddress);
    const receipt = await tx.wait();
    
    // Get the completion ID from the event
    const completionEvent = receipt.logs.find(
      log => log.fragment?.name === 'CompletionSubmitted'
    );
    const completionId = completionEvent?.args?.completionId;
    
    // Auto-approve the completion
    if (completionId !== undefined) {
      const approveTx = await taskManagerWithSigner.verifyCompletion(completionId, true);
      await approveTx.wait();
    }
    
    // Save to database for records
    await TaskSubmission.create({
      campaignId,
      userId: user.id,
      proofUrl: `@${user.twitterUsername}`,
      status: 'approved',
      rewardAmount: ethers.formatUnits(campaign.rewardPerTask, 9),
      transactionHash: receipt.hash
    });
    
    res.json({
      success: true,
      data: {
        completionId,
        txHash: receipt.hash,
        reward: ethers.formatUnits(campaign.rewardPerTask, 9)
      },
      message: `Task verified! ${ethers.formatUnits(campaign.rewardPerTask, 9)} EPWX sent to your wallet!`
    });
  } catch (error) {
    console.error('Submit task error:', error);
    console.error('Error stack:', error.stack);
    
    // Return more specific error messages
    let errorMessage = 'Failed to submit task';
    if (error.message) {
      errorMessage = error.message;
    }
    if (error.response?.data) {
      errorMessage = error.response.data.error || error.response.data.message || errorMessage;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
