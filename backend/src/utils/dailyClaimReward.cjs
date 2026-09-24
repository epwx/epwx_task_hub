function calculateDailyClaimReward(baseAmount, isTelegramMember, isEmailVerified) {
  const normalizedBaseAmount = BigInt(String(baseAmount));
  const telegramAdjustedAmount = isTelegramMember ? normalizedBaseAmount : normalizedBaseAmount / 2n;

  return {
    amount: telegramAdjustedAmount.toString(),
    baseAmount: normalizedBaseAmount.toString(),
    telegramAdjustedAmount: telegramAdjustedAmount.toString(),
    emailBonusAmount: '0',
    emailBonusBps: 0,
    telegramMember: Boolean(isTelegramMember),
    emailVerified: Boolean(isEmailVerified),
  };
}

module.exports = {
  calculateDailyClaimReward,
};