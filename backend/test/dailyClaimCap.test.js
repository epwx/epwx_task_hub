const {
  DEFAULT_DAILY_CLAIM_CAP_EPWX,
  parseDailyClaimCap,
  calculateCappedDailyClaimAmount,
} = require('../src/utils/dailyClaimCap.cjs');

describe('Daily Claim daily cap', () => {
  test('pays the full tier amount while the cap has room', () => {
    expect(calculateCappedDailyClaimAmount({
      requestedAmount: '10000000',
      reservedTodayAmount: '50000000',
      dailyCap: '100000000',
    })).toEqual({ amount: '10000000', remainingBeforeClaim: '50000000', capped: false });
  });

  test('pays only the remaining amount when the claim would exceed the cap', () => {
    expect(calculateCappedDailyClaimAmount({
      requestedAmount: '10000000',
      reservedTodayAmount: '99999995',
      dailyCap: '100000000',
    })).toEqual({ amount: '5', remainingBeforeClaim: '5', capped: true });
  });

  test('returns zero when the cap is already fully reserved or exceeded', () => {
    expect(calculateCappedDailyClaimAmount({
      requestedAmount: '100000',
      reservedTodayAmount: '100000000',
      dailyCap: '100000000',
    }).amount).toBe('0');

    expect(calculateCappedDailyClaimAmount({
      requestedAmount: '100000',
      reservedTodayAmount: '100000001',
      dailyCap: '100000000',
    }).amount).toBe('0');
  });

  test('parses the configured cap and falls back to the default when unset', () => {
    expect(parseDailyClaimCap(undefined)).toBe(DEFAULT_DAILY_CLAIM_CAP_EPWX);
    expect(parseDailyClaimCap('  ')).toBe(DEFAULT_DAILY_CLAIM_CAP_EPWX);
    expect(parseDailyClaimCap('250000000')).toBe('250000000');
  });

  test('rejects a cap that is not a whole number', () => {
    expect(() => parseDailyClaimCap('100M')).toThrow('Invalid daily claim cap');
    expect(() => parseDailyClaimCap('-1')).toThrow('Invalid daily claim cap');
  });
});
