import express from 'express';
import { getEPWXPurchaseTransactions } from '../services/epwxCashback.js';
import { TaskSubmission, Campaign, User } from '../models/index.js';
import { authenticateToken } from './auth.js';
import { taskManagerWithSigner } from '../services/blockchain.js';
// Removed Twitter-related imports
import { ethers } from 'ethers';
const router = express.Router();

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
    
    // ...existing code...
        
        console.log('[Task Submit] Token refreshed successfully, clearing cache and retrying verification...');
        
        // Clear cache for this user to force fresh verification
        twitterVerification.clearUserCache(user.twitterId);
        
        // Retry verification with new token
        verification = await twitterVerification.verifyTask(
          campaign.taskType,
          user.twitterUsername,
          campaign.targetUrl,
          accessToken,
          user.twitterId
        );
      } catch (refreshError) {
        console.error('[Task Submit] Token refresh failed:', refreshError);
        return res.status(401).json({ 
          error: 'Your X/Twitter connection has expired. Please reconnect your account.',
          success: false,
          requiresTwitterAuth: true
        });
      }
    }
    
    console.log('[Task Submit] Verification result:', verification);
    
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
      completionId: completionId ? Number(completionId) : null,
      userId: user.id,
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
          attributes: ['walletAddress']
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

/**
 * GET /api/tasks/completed/:walletAddress
 * Get completed tasks for a wallet address
 */
router.get('/completed/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Find user by wallet address
    const user = await User.findOne({ where: { walletAddress } });
    
    if (!user) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get approved task submissions for this user
    const submissions = await TaskSubmission.findAll({
      where: { 
        userId: user.id,
        status: 'approved'
      },
      attributes: ['id', 'completionId', 'rewardAmount', 'transactionHash', 'createdAt', 'metadata'],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
    res.status(500).json({ error: 'Failed to fetch completed tasks' });
  }
});

export default router;
/**
 * GET /api/tasks/swaps
 * Get swap transactions from the last 3 hours as available tasks
 */
router.get('/swaps/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing wallet address' });
    }
    // Calculate timestamp for 3 hours ago
    const now = Math.floor(Date.now() / 1000);
    const threeHoursAgo = now - 3 * 60 * 60;
    // Fetch swap transactions
    const swaps = await getEPWXPurchaseTransactions(walletAddress, threeHoursAgo);
    res.json({ success: true, data: swaps });
  } catch (error) {
    console.error('Error fetching swap transactions:', error);
    res.status(500).json({ error: 'Failed to fetch swap transactions' });
  }
});
