import path from 'path';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Claim,
  RewardDistributionLedger,
  SocialClaimVerificationAttempt,
  TwitterCampaign,
} from '../models/index.js';
import { analyzeSocialProof, SOCIAL_PROOF_RUBRIC_VERSION } from './socialProofAnalyzer.js';
import { evaluateSocialClaimEvidence } from './socialClaimPolicy.js';
import { perceptualHashDistance } from './socialProofImage.js';
import { distributeEpwxReward } from './rewardTransfer.js';

const SOCIAL_CLAIM_TYPES = ['twitter_retweet', 'twitter_comment', 'twitter_poll', 'twitter_rating'];

function enabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || 'false').toLowerCase());
}

function sanitizedErrorCode(error) {
  if (typeof error?.code === 'string' && /^[A-Z0-9_]{3,64}$/.test(error.code)) return error.code;
  if (error?.name === 'TimeoutError') return 'ANALYZER_TIMEOUT';
  return 'ANALYZER_FAILED';
}

function resolveImagePath(receiptImage) {
  return path.resolve(process.cwd(), String(receiptImage || '').replace(/\//g, path.sep));
}

async function findDuplicate(claim, ClaimModel = Claim) {
  const exact = await ClaimModel.findOne({
    where: {
      id: { [Op.ne]: claim.id },
      claimType: { [Op.in]: SOCIAL_CLAIM_TYPES },
      proofSha256: claim.proofSha256,
    },
    attributes: ['id'],
  });
  if (exact) return { exact: true, near: false, claimId: exact.id };

  const candidates = await ClaimModel.findAll({
    where: {
      id: { [Op.ne]: claim.id },
      claimType: { [Op.in]: SOCIAL_CLAIM_TYPES },
      proofPerceptualHash: { [Op.ne]: null },
    },
    attributes: ['id', 'proofSha256', 'proofPerceptualHash'],
    limit: 200,
  });
  const maxDistance = Number.parseInt(process.env.SOCIAL_CLAIM_PERCEPTUAL_HASH_DISTANCE || '4', 10);
  const near = candidates.find((entry) => (
    perceptualHashDistance(claim.proofPerceptualHash, entry.proofPerceptualHash) <= maxDistance
  ));
  return { exact: false, near: Boolean(near), claimId: near?.id || null };
}

export async function processSocialClaimVerification(claimId, options = {}) {
  const models = options.models || {
    Claim,
    SocialClaimVerificationAttempt,
    TwitterCampaign,
  };
  const database = options.sequelize || sequelize;
  const leaseMinutes = Number.parseInt(process.env.SOCIAL_CLAIM_VERIFICATION_LEASE_MINUTES || '5', 10);
  const leaseUntil = new Date(Date.now() + leaseMinutes * 60 * 1000);
  const [leased] = await models.Claim.update(
    { verificationStatus: 'processing', verificationLeaseUntil: leaseUntil },
    {
      where: {
        id: claimId,
        status: 'pending',
        verificationStatus: { [Op.in]: ['queued', 'retry'] },
      },
    }
  );
  if (!leased) return { processed: false, reason: 'not_eligible' };

  const claim = await models.Claim.findByPk(claimId);
  const campaign = await models.TwitterCampaign.findByPk(claim.twitterCampaignId);
  const attemptNumber = Number(claim.verificationAttempts || 0) + 1;
  const attempt = await models.SocialClaimVerificationAttempt.create({
    claimId: claim.id,
    attemptNumber,
    status: 'processing',
    rubricVersion: SOCIAL_PROOF_RUBRIC_VERSION,
    startedAt: new Date(),
  });

  try {
    if (!campaign) {
      const error = new Error('Campaign not found.');
      error.code = 'CAMPAIGN_NOT_FOUND';
      throw error;
    }

    const duplicate = await findDuplicate(claim, models.Claim);
    const analysis = await (options.analyze || analyzeSocialProof)({
      imagePath: resolveImagePath(claim.receiptImage),
      campaign,
      twitterUsername: claim.twitterUsername,
    });
    const policy = evaluateSocialClaimEvidence({
      analysis,
      taskType: campaign.taskType,
      twitterUsername: claim.twitterUsername,
      duplicate,
    });
    const mode = String(process.env.SOCIAL_CLAIM_VERIFICATION_MODE || 'shadow').toLowerCase();
    const nextStatus = mode === 'enforce'
      ? (policy.decision === 'approve' ? 'approved' : policy.decision === 'reject' ? 'rejected' : 'pending')
      : 'pending';

    await database.transaction(async (transaction) => {
      await attempt.update({
        status: 'completed',
        provider: analysis.provider,
        model: analysis.model,
        rubricVersion: analysis.rubricVersion || SOCIAL_PROOF_RUBRIC_VERSION,
        decision: policy.decision,
        confidence: policy.confidence,
        signals: { ...analysis.signals, duplicate },
        reasonCodes: policy.reasonCodes,
        completedAt: new Date(),
      }, { transaction });
      await claim.update({
        status: nextStatus,
        verificationStatus: policy.decision === 'manual_review' || mode !== 'enforce' ? 'manual_review' : 'completed',
        verificationDecision: policy.decision,
        verificationConfidence: policy.confidence,
        verificationCompletedAt: new Date(),
        verificationLeaseUntil: null,
        verificationNextAttemptAt: null,
        verificationAttempts: attemptNumber,
        approvedAt: nextStatus === 'approved' ? new Date() : null,
        approvedBy: nextStatus === 'approved' ? 'system:social-proof' : null,
        payoutStatus: nextStatus === 'approved' ? 'pending' : claim.payoutStatus,
        rejectionComment: nextStatus === 'rejected' ? policy.reasonCodes.join(', ') : claim.rejectionComment,
      }, { transaction });
    });
    return { processed: true, decision: policy.decision, status: nextStatus };
  } catch (error) {
    const maxAttempts = Number.parseInt(process.env.SOCIAL_CLAIM_MAX_VERIFICATION_ATTEMPTS || '3', 10);
    const exhausted = attemptNumber >= maxAttempts || sanitizedErrorCode(error) === 'ANALYZER_NOT_CONFIGURED';
    await database.transaction(async (transaction) => {
      await attempt.update({
        status: 'failed',
        errorCode: sanitizedErrorCode(error),
        completedAt: new Date(),
      }, { transaction });
      await claim.update({
        verificationStatus: exhausted ? 'manual_review' : 'retry',
        verificationDecision: exhausted ? 'manual_review' : null,
        verificationLeaseUntil: null,
        verificationNextAttemptAt: exhausted
          ? null
          : new Date(Date.now() + Math.min(60 * (2 ** (attemptNumber - 1)), 60 * 60) * 1000),
        verificationAttempts: attemptNumber,
      }, { transaction });
    });
    return { processed: true, decision: exhausted ? 'manual_review' : 'retry', errorCode: sanitizedErrorCode(error) };
  }
}

export async function runSocialClaimVerificationBatch(options = {}) {
  if (!enabled(process.env.SOCIAL_CLAIM_AUTO_VERIFICATION_ENABLED)) {
    return { enabled: false, processed: 0, approved: 0, rejected: 0, manualReview: 0, retried: 0 };
  }
  const batchSize = Number.parseInt(process.env.SOCIAL_CLAIM_VERIFICATION_BATCH_SIZE || '10', 10);
  const now = new Date();
  const ClaimModel = options.models?.Claim || Claim;
  await ClaimModel.update(
    { verificationStatus: 'retry', verificationLeaseUntil: null },
    {
      where: {
        verificationStatus: 'processing',
        verificationLeaseUntil: { [Op.lt]: now },
      },
    }
  );
  const claims = await ClaimModel.findAll({
    where: {
      status: 'pending',
      claimType: { [Op.in]: SOCIAL_CLAIM_TYPES },
      verificationStatus: { [Op.in]: ['queued', 'retry'] },
      [Op.or]: [
        { verificationNextAttemptAt: null },
        { verificationNextAttemptAt: { [Op.lte]: now } },
      ],
    },
    order: [['createdAt', 'ASC']],
    limit: batchSize,
  });

  const summary = { enabled: true, processed: 0, approved: 0, rejected: 0, manualReview: 0, retried: 0 };
  for (const claim of claims) {
    const result = await processSocialClaimVerification(claim.id, options);
    if (!result.processed) continue;
    summary.processed += 1;
    if (result.decision === 'approve') summary.approved += 1;
    else if (result.decision === 'reject') summary.rejected += 1;
    else if (result.decision === 'retry') summary.retried += 1;
    else summary.manualReview += 1;
  }
  return summary;
}

export async function settleApprovedSocialClaims(options = {}) {
  if (!enabled(process.env.SOCIAL_CLAIM_AUTO_SETTLEMENT_ENABLED) && !options.force) {
    return { enabled: false, processed: 0, paid: 0, failed: 0 };
  }
  const models = options.models || { Claim, RewardDistributionLedger };
  const database = options.sequelize || sequelize;
  const batchSize = Number.parseInt(process.env.SOCIAL_CLAIM_SETTLEMENT_BATCH_SIZE || '10', 10);
  const claims = await models.Claim.findAll({
    where: {
      ...(options.claimId ? { id: options.claimId } : {}),
      status: 'approved',
      claimType: { [Op.in]: SOCIAL_CLAIM_TYPES },
      txHash: null,
      [Op.or]: [
        { payoutStatus: { [Op.in]: ['pending', 'failed'] } },
        { payoutStatus: null },
      ],
    },
    order: [['approvedAt', 'ASC']],
    limit: batchSize,
  });
  const summary = { enabled: true, processed: 0, paid: 0, failed: 0 };

  for (const claim of claims) {
    const leaseUntil = new Date(Date.now() + 10 * 60 * 1000);
    const [leased] = await models.Claim.update(
      { payoutStatus: 'processing', payoutLeaseUntil: leaseUntil, payoutLastError: null },
      {
        where: {
          id: claim.id,
          status: 'approved',
          txHash: null,
          [Op.or]: [
            { payoutStatus: null },
            { payoutStatus: { [Op.in]: ['pending', 'failed'] } },
          ],
        },
      }
    );
    if (!leased) continue;
    summary.processed += 1;
    try {
      const payout = await (options.distribute || distributeEpwxReward)(claim.customer, claim.bill || '100000');
      await database.transaction(async (transaction) => {
        await claim.update({
          status: 'paid',
          payoutStatus: 'paid',
          payoutLeaseUntil: null,
          payoutLastError: null,
          txHash: payout.txHash,
          paidAt: new Date(),
        }, { transaction });
        await models.RewardDistributionLedger.findOrCreate({
          where: { source_type: 'social_engagement_claim', source_id: String(claim.id) },
          defaults: {
            date: new Date(),
            merchant_id: null,
            merchant_name: null,
            customer_id: claim.customer,
            receipt_id: String(claim.id),
            epwx_amount: claim.bill || '100000',
            fiat_value: null,
            transaction_hash: payout.txHash,
            notes: `Social engagement claim ${claim.campaignCode || ''} (${claim.claimType})`,
            source_type: 'social_engagement_claim',
            source_id: String(claim.id),
          },
          transaction,
        });
      });
      summary.paid += 1;
    } catch (error) {
      await claim.update({
        payoutStatus: error?.txHash ? 'reconciliation_required' : 'failed',
        payoutLeaseUntil: null,
        payoutLastError: sanitizedErrorCode(error),
        txHash: error?.txHash || null,
      });
      summary.failed += 1;
    }
  }
  return summary;
}
