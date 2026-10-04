const { calculateRetentionAnalytics } = require('../src/utils/dailyClaimAnalytics.cjs');

const now = new Date('2026-10-04T12:00:00.000Z');
const daysAgo = days => new Date(now.getTime() - (days * 24 * 60 * 60 * 1000)).toISOString();

describe('Daily Claim retention analytics', () => {
  it('calculates activity, cohorts, streaks, resets, and returning-wallet rewards', () => {
    const analytics = calculateRetentionAnalytics({
      now,
      firstClaimByWallet: [
        { wallet: '0xNew', firstClaimAt: daysAgo(2) },
        { wallet: '0xReturning', firstClaimAt: daysAgo(40) },
        { wallet: '0xSevenDay', firstClaimAt: daysAgo(10) },
        { wallet: '0xThirtyDay', firstClaimAt: daysAgo(45) },
      ],
      claims: [
        { wallet: '0xNew', claimedAt: daysAgo(2), streakDay: 1, amount: '100', status: 'paid' },
        { wallet: '0xNew', claimedAt: daysAgo(0.5), streakDay: 2, amount: '100', status: 'paid' },
        { wallet: '0xReturning', claimedAt: daysAgo(40), streakDay: 1, amount: '100', status: 'paid' },
        { wallet: '0xReturning', claimedAt: daysAgo(5), streakDay: 1, amount: '300', status: 'paid' },
        { wallet: '0xReturning', claimedAt: daysAgo(1), streakDay: 1, amount: '500', status: 'paid' },
        { wallet: '0xSevenDay', claimedAt: daysAgo(10), streakDay: 1, amount: '100', status: 'paid' },
        { wallet: '0xSevenDay', claimedAt: daysAgo(6), streakDay: 2, amount: '100', status: 'pending' },
        { wallet: '0xSevenDay', claimedAt: daysAgo(0.25), streakDay: 7, amount: '100', status: 'pending' },
        { wallet: '0xThirtyDay', claimedAt: daysAgo(45), streakDay: 1, amount: '100', status: 'paid' },
        { wallet: '0xThirtyDay', claimedAt: daysAgo(20), streakDay: 2, amount: '100', status: 'paid' },
      ],
    });

    expect(analytics.activity).toEqual({
      dailyActiveWallets: 3,
      weeklyActiveWallets: 3,
      monthlyActiveWallets: 4,
    });
    expect(analytics.walletMixLast30Days).toEqual({ newWallets: 2, returningWallets: 2 });
    expect(analytics.retention.sevenDay).toEqual({ eligible: 1, returned: 1, rate: 100 });
    expect(analytics.retention.thirtyDay).toEqual({ eligible: 2, returned: 1, rate: 50 });
    expect(analytics.streaks.distribution).toEqual({ '1': 1, '2': 1, '3': 0, '4': 0, '5': 0, '6': 0, '7': 1 });
    expect(analytics.streaks.daySevenCompletionRate).toBe(25);
    expect(analytics.streaks.resetClaimsLast30Days).toBe(2);
    expect(analytics.rewards).toEqual({
      paidToReturningWalletsLast30Days: '900',
      returningWallets: 2,
      averagePaidPerReturningWallet: '450',
    });
  });

  it('returns zero rates when no wallets are eligible', () => {
    const analytics = calculateRetentionAnalytics({ now, claims: [], firstClaimByWallet: [] });

    expect(analytics.retention.sevenDay.rate).toBe(0);
    expect(analytics.retention.thirtyDay.rate).toBe(0);
    expect(analytics.streaks.resetRate).toBe(0);
    expect(analytics.rewards.averagePaidPerReturningWallet).toBe('0');
  });
});