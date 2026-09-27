const STREAK_GRACE_PERIOD_MS = 48 * 60 * 60 * 1000;
const STREAK_ENTRY_SCHEDULE = [1, 1, 2, 2, 3, 3, 5];

function normalizeStreakDay(value) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 7 ? parsed : 0;
}

function getDrawEntriesForStreakDay(streakDay) {
  const normalizedDay = normalizeStreakDay(streakDay);
  return normalizedDay ? STREAK_ENTRY_SCHEDULE[normalizedDay - 1] : 1;
}

function calculateDailyClaimStreak(previousClaim, claimedAt = new Date()) {
  const currentClaimTime = new Date(claimedAt).getTime();
  const previousClaimTime = previousClaim?.claimedAt ? new Date(previousClaim.claimedAt).getTime() : Number.NaN;
  const previousStreakDay = normalizeStreakDay(previousClaim?.streakDay);
  const continuesStreak = Number.isFinite(previousClaimTime)
    && currentClaimTime >= previousClaimTime
    && currentClaimTime - previousClaimTime <= STREAK_GRACE_PERIOD_MS
    && previousStreakDay > 0;

  const streakDay = continuesStreak
    ? (previousStreakDay === 7 ? 1 : previousStreakDay + 1)
    : 1;

  return {
    streakDay,
    drawEntries: getDrawEntriesForStreakDay(streakDay),
    streakContinued: continuesStreak,
  };
}

module.exports = {
  STREAK_GRACE_PERIOD_MS,
  STREAK_ENTRY_SCHEDULE,
  calculateDailyClaimStreak,
  getDrawEntriesForStreakDay,
};