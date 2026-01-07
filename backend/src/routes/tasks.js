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
      // Only one /submit endpoint should exist. Duplicate definitions removed.
      const approveTx = await taskManagerWithSigner.verifyCompletion(completionId, true);
      await approveTx.wait();
    }

    // Save to database for records
    await TaskSubmission.create({
      completionId: completionId ? Number(completionId) : null,
      userId: userAddress, // Adjust if you have a separate userId
      status: 'approved',
      rewardAmount: ethers.formatUnits(receipt.value || 0, 9),
      transactionHash: receipt.hash,
      metadata: {
        campaignId: Number(campaignId)
      }
    });

    res.json({
      success: true,
      data: {
        completionId,
        txHash: receipt.hash,
        reward: ethers.formatUnits(receipt.value || 0, 9)
      },
      message: `Task verified! ${ethers.formatUnits(receipt.value || 0, 9)} EPWX sent to your wallet!`
    });
  } catch (error) {
    console.error('Submit task error:', error);
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
      completionId: completionId ? Number(completionId) : null,
      userId: userAddress, // Assuming userAddress is userId, adjust if needed
      status: 'approved',
      rewardAmount: ethers.formatUnits(receipt.value || 0, 9),
      transactionHash: receipt.hash,
      metadata: {
        campaignId: Number(campaignId),
        // Add other metadata fields as needed
      }
    });

    res.json({
      success: true,
      data: {
        completionId,
        txHash: receipt.hash,
        reward: ethers.formatUnits(receipt.value || 0, 9)
      },
      message: `Task verified! ${ethers.formatUnits(receipt.value || 0, 9)} EPWX sent to your wallet!`
    });
  } catch (error) {
    console.error('Submit task error:', error);
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
