const DAY_MS = 24 * 60 * 60 * 1000;
const { calculateDailyClaimStreak, STREAK_GRACE_PERIOD_MS } = require('./dailyClaimStreak.cjs');

function buildReadyReminderCopy(claim, now = new Date()) {
  const claimedAt = new Date(claim?.claimedAt).getTime();
  const currentTime = new Date(now).getTime();
  if (!Number.isFinite(claimedAt) || !Number.isFinite(currentTime) || currentTime < claimedAt + DAY_MS) {
    throw new Error('Cannot personalize a reminder before a valid claim cooldown has elapsed.');
  }
  const streak = calculateDailyClaimStreak(claim, now);
  const entries = `${streak.drawEntries} draw ${streak.drawEntries === 1 ? 'entry' : 'entries'}`;
  const benefit = `Your next successful claim unlocks Day ${streak.streakDay} with ${entries}.`;
  const deadline = new Date(claimedAt + STREAK_GRACE_PERIOD_MS).toUTCString();
  const timing = !streak.streakContinued
    ? 'Start a fresh seven-day streak with your next successful claim.'
    : Number(claim.streakDay) === 7
      ? 'Seven-day cycle complete! Your next successful claim starts a new cycle at Day 1.'
      : `To continue this streak, complete your next claim no later than ${deadline}.`;
  return {
    subject: `Your EPWX claim is ready: Day ${streak.streakDay}, ${entries}`,
    paragraphs: [
      'Your 24-hour Daily Claim cooldown has ended.',
      benefit,
      timing,
      'Streaks increase draw entries, not your token reward. Entries do not guarantee a win. Existing eligibility rules apply.',
    ],
  };
}

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
  buildReadyReminderCopy,
  isReadyReminderEligible,
  isSuccessRetryEligible,
};