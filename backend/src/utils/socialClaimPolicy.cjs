function parseThreshold(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

function getEnabledSocialClaimTaskTypes(value = process.env.SOCIAL_CLAIM_AUTO_TASK_TYPES || 'retweet,comment') {
  return new Set(String(value).split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean));
}

function evaluateSocialClaimEvidence({
  analysis,
  taskType,
  twitterUsername,
  duplicate = null,
  approvalThreshold = parseThreshold(process.env.SOCIAL_CLAIM_APPROVAL_THRESHOLD, 0.97),
  rejectionThreshold = parseThreshold(process.env.SOCIAL_CLAIM_REJECTION_THRESHOLD, 0.99),
  enabledTaskTypes = getEnabledSocialClaimTaskTypes(),
}) {
  if (!enabledTaskTypes.has(taskType)) {
    return { decision: 'manual_review', confidence: analysis.confidence, reasonCodes: ['TASK_TYPE_MANUAL_ONLY'] };
  }
  if (!twitterUsername) {
    return { decision: 'manual_review', confidence: analysis.confidence, reasonCodes: ['USERNAME_REQUIRED'] };
  }
  if (duplicate?.exact) {
    return { decision: 'reject', confidence: 1, reasonCodes: ['EXACT_DUPLICATE_PROOF'] };
  }
  if (duplicate?.near) {
    return { decision: 'manual_review', confidence: analysis.confidence, reasonCodes: ['POSSIBLE_DUPLICATE_PROOF'] };
  }

  const signals = analysis.signals || {};
  const requiredSignals = ['imageReadable', 'socialPlatform', 'targetPost', 'account', 'taskAction'];
  const allRequiredSignalsPass = requiredSignals.every((name) => (
    signals[name]?.matched === true && Number(signals[name]?.confidence) >= approvalThreshold
  ));
  if (allRequiredSignalsPass && !signals.mismatch && analysis.confidence >= approvalThreshold) {
    return { decision: 'approve', confidence: analysis.confidence, reasonCodes: analysis.reasonCodes };
  }

  const unreadable = signals.imageReadable?.matched === false
    && Number(signals.imageReadable?.confidence) >= rejectionThreshold;
  const confirmedMismatch = signals.mismatch === true && analysis.confidence >= rejectionThreshold;
  if (unreadable || confirmedMismatch) {
    return {
      decision: 'reject',
      confidence: analysis.confidence,
      reasonCodes: unreadable ? ['UNREADABLE_OR_NOT_PROOF'] : ['CAMPAIGN_OR_ACCOUNT_MISMATCH'],
    };
  }

  return {
    decision: 'manual_review',
    confidence: analysis.confidence,
    reasonCodes: analysis.reasonCodes?.length ? analysis.reasonCodes : ['INCONCLUSIVE_EVIDENCE'],
  };
}

module.exports = {
  evaluateSocialClaimEvidence,
  getEnabledSocialClaimTaskTypes,
  parseThreshold,
};
