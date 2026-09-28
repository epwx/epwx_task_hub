const DAY_MS = 24 * 60 * 60 * 1000;

function sameId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

function isSuccessRetryEligible(preference, claim) {
  if (!preference?.emailVerifiedAt || !preference.successEmailsEnabled || preference.unsubscribedAt) {
    return false;
  }
  if (!claim || claim.status !== 'paid' || !sameId(preference.pendingSuccessClaimId, claim.id)) {
    return false;
  }
  return !sameId(preference.lastSuccessClaimId, claim.id);
}

function isReadyReminderEligible(preference, claim, now = new Date()) {
  if (!preference?.emailVerifiedAt || !preference.remindersEnabled || preference.unsubscribedAt) {
    return false;
  }
  if (!claim || sameId(preference.lastReminderClaimId, claim.id)) {
    return false;
  }

  const claimedAt = new Date(claim.claimedAt).getTime();
  const currentTime = new Date(now).getTime();
  return Number.isFinite(claimedAt) && Number.isFinite(currentTime) && claimedAt + DAY_MS <= currentTime;
}

module.exports = {
  isReadyReminderEligible,
  isSuccessRetryEligible,
};