import express from 'express';
import rateLimit from 'express-rate-limit';
import { SecurityAuthorization, TaskSubmission, User } from '../models/index.js';
import { taskManagerWithSigner } from '../services/blockchain.js';
import { ethers } from 'ethers';
import twitterVerification from '../services/twitterVerification.js';
import {
  createTaskSubmissionAuthorizationMessage,
  verifyAndConsumeAuthorization,
} from '../utils/signedAuthorization.js';
const router = express.Router();

const submitTaskLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many task submissions. Please try again later.' },
});

/**
 * POST /api/tasks/submit
 * Submit a task completion
 */
router.post('/submit', submitTaskLimiter, async (req, res) => {
  try {
    const { campaignId, walletAddress, twitterUsername, authorization } = req.body;
    const numericCampaignId = Number(campaignId);
    const userAddress = String(walletAddress || '').toLowerCase();
    const normalizedTwitterUsername = String(twitterUsername || '').trim().replace(/^@/, '').toLowerCase();

    if (!Number.isSafeInteger(numericCampaignId) || numericCampaignId < 0) {
      return res.status(400).json({ error: 'A valid campaignId is required.' });
    }
    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: 'A valid wallet address is required.' });
    }
    if (!normalizedTwitterUsername) {
      return res.status(400).json({ error: 'A linked X/Twitter username is required.' });
    }
    if (!taskManagerWithSigner) {
      return res.status(503).json({ error: 'Task verification is temporarily unavailable.' });
    }

    const authorizationMessage = createTaskSubmissionAuthorizationMessage({
      wallet: userAddress,
      campaignId: numericCampaignId,
      twitterUsername: normalizedTwitterUsername,
      issuedAt: authorization?.issuedAt,
      nonce: authorization?.nonce,
    });
    const authorizationResult = await verifyAndConsumeAuthorization({
      authorization,
      expectedWallet: userAddress,
      purpose: `task-submit:${numericCampaignId}`,
      message: authorizationMessage,
      authorizationModel: SecurityAuthorization,
    });
    if (!authorizationResult.ok) {
      return res.status(authorizationResult.status).json({ error: authorizationResult.error });
    }

    const user = await User.findOne({ where: { walletAddress: userAddress } });
    if (!user?.twitterId || !user?.twitterUsername) {
      return res.status(401).json({
        error: 'Connect your X/Twitter account before submitting a task.',
        requiresTwitterAuth: true,
      });
    }
    if (String(user.twitterUsername).toLowerCase() !== normalizedTwitterUsername) {
      return res.status(403).json({ error: 'The submitted X/Twitter account does not match the linked account.' });
    }

    const campaign = await taskManagerWithSigner.campaigns(numericCampaignId);
    const deadlineSeconds = Number(campaign.deadline);
    if (!campaign.active || deadlineSeconds * 1000 <= Date.now()) {
      return res.status(409).json({ error: 'Campaign is not active.' });
    }
    if (campaign.completedCount >= campaign.maxCompletions) {
      return res.status(409).json({ error: 'Campaign is full.' });
    }
    if (await taskManagerWithSigner.hasCompleted(numericCampaignId, userAddress)) {
      return res.status(409).json({ error: 'This wallet has already completed the campaign.' });
    }

    const verification = await twitterVerification.verifyTask(
      campaign.taskType,
      user.twitterUsername,
      campaign.targetUrl,
      user.twitterAccessToken,
      user.twitterId,
    );
    if (!verification.verified) {
      return res.status(422).json({
        error: verification.message || 'The required X/Twitter action could not be verified.',
      });
    }

    const tx = await taskManagerWithSigner.submitCompletion(numericCampaignId, userAddress);
    const receipt = await tx.wait();

    const completionEvent = receipt.logs.find(
      log => log.fragment?.name === 'TaskCompleted'
    );
    const completionId = completionEvent?.args?.completionId;

    if (completionId === undefined) {
      throw new Error('Task submission transaction did not emit a completion ID.');
    }
    const approveTx = await taskManagerWithSigner.verifyCompletion(completionId, true);
    const approveReceipt = await approveTx.wait();

    await TaskSubmission.create({
      completionId: Number(completionId),
      userId: user.id,
      status: 'approved',
      verifiedAt: new Date(),
      rewardAmount: campaign.rewardPerTask.toString(),
      transactionHash: approveReceipt.hash,
      metadata: {
        campaignId: numericCampaignId,
        twitterUsername: normalizedTwitterUsername,
        submissionTransactionHash: receipt.hash,
      }
    });

    res.json({
      success: true,
      data: {
        completionId,
        txHash: approveReceipt.hash,
        reward: ethers.formatUnits(campaign.rewardPerTask, 9)
      },
      message: `Task verified! ${ethers.formatUnits(campaign.rewardPerTask, 9)} EPWX added to your pending rewards.`
    });
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ 
      error: 'Failed to submit task.',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;