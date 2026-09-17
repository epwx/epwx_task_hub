const { calculateDailyClaimReward } = require('../src/utils/dailyClaimReward.cjs');

describe('Daily Claim reward calculation', () => {
  test.each([
    [false, false, '50000', '0'],
    [false, true, '75000', '25000'],
    [true, false, '100000', '0'],
    [true, true, '125000', '25000'],
  ])('calculates Telegram member=%s and email verified=%s', (telegramMember, emailVerified, amount, emailBonusAmount) => {
    expect(calculateDailyClaimReward('100000', telegramMember, emailVerified)).toEqual({
      amount,
      baseAmount: '100000',
      telegramAdjustedAmount: telegramMember ? '100000' : '50000',
      emailBonusAmount,
      emailBonusBps: 2500,
      telegramMember,
      emailVerified,
    });
  });

  it('supports a configurable basis-point bonus', () => {
    expect(calculateDailyClaimReward('100000', true, true, 1000).amount).toBe('110000');
  });
});