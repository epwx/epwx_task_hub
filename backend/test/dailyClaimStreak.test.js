const {
  STREAK_ENTRY_SCHEDULE,
  calculateDailyClaimStreak,
  getDrawEntriesForStreakDay,
} = require('../src/utils/dailyClaimStreak.cjs');

describe('Daily Claim streak', () => {
  it('uses the seven-day draw-entry schedule', () => {
    expect(STREAK_ENTRY_SCHEDULE).toEqual([1, 1, 2, 2, 3, 3, 5]);
    expect(STREAK_ENTRY_SCHEDULE.map((_, index) => getDrawEntriesForStreakDay(index + 1)))
      .toEqual([1, 1, 2, 2, 3, 3, 5]);
  });

  it('advances when the next claim is within the 48-hour grace period', () => {
    expect(calculateDailyClaimStreak(
      { claimedAt: '2026-09-25T12:00:00.000Z', streakDay: 3 },
      '2026-09-27T11:59:59.000Z',
    )).toEqual({ streakDay: 4, drawEntries: 2, streakContinued: true });
  });

  it('resets after the grace period', () => {
    expect(calculateDailyClaimStreak(
      { claimedAt: '2026-09-25T12:00:00.000Z', streakDay: 6 },
      '2026-09-27T12:00:01.000Z',
    )).toEqual({ streakDay: 1, drawEntries: 1, streakContinued: false });
  });

  it('starts a new seven-day cycle after day seven', () => {
    expect(calculateDailyClaimStreak(
      { claimedAt: '2026-09-25T12:00:00.000Z', streakDay: 7 },
      '2026-09-26T12:00:00.000Z',
    )).toEqual({ streakDay: 1, drawEntries: 1, streakContinued: true });
  });

  it('starts at day one for a wallet without streak history', () => {
    expect(calculateDailyClaimStreak(null, '2026-09-26T12:00:00.000Z'))
      .toEqual({ streakDay: 1, drawEntries: 1, streakContinued: false });
  });
});