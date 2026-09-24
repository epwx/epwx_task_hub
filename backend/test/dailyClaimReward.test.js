const { calculateDailyClaimReward } = require('../src/utils/dailyClaimReward.cjs');

describe('Daily Claim reward calculation', () => {
  test.each([
    [false, false, '50000', '0'],
    [false, true, '50000', '0'],
    [true, false, '100000', '0'],
    [true, true, '100000', '0'],
  ])('calculates Telegram member=%s and email verified=%s', (telegramMember, emailVerified, amount, emailBonusAmount) => {
    expect(calculateDailyClaimReward('100000', telegramMember, emailVerified)).toEqual({
      amount,
      baseAmount: '100000',
      telegramAdjustedAmount: telegramMember ? '100000' : '50000',
      emailBonusAmount,
      emailBonusBps: 0,
      telegramMember,
      emailVerified,
    });
  });
});