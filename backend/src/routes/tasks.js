import express from 'express';
import { TaskSubmission } from '../models/index.js';
import { taskManagerWithSigner } from '../services/blockchain.js';
import { ethers } from 'ethers';
const router = express.Router();

/**
 * POST /api/tasks/submit
 * Submit a task completion
 */
router.post('/submit', async (req, res) => {
  try {
    const { campaignId, walletAddress } = req.body;
    const userAddress = walletAddress;

    console.log('[Task Submit] Request:', { campaignId, walletAddress });

    if (!campaignId) {
      return res.status(400).json({ error: 'Missing campaignId' });
    }
    if (!userAddress) {
      return res.status(400).json({ error: 'Wallet address not found' });
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

export default router;