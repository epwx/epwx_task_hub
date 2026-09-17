const DEFAULT_EMAIL_VERIFIED_BONUS_BPS = 2500;

function normalizeBonusBps(value) {
  const parsedValue = Number.parseInt(String(value), 10);
  return Number.isInteger(parsedValue) && parsedValue >= 0 && parsedValue <= 10000
    ? parsedValue
    : DEFAULT_EMAIL_VERIFIED_BONUS_BPS;
}

function calculateDailyClaimReward(baseAmount, isTelegramMember, isEmailVerified, emailBonusBps = DEFAULT_EMAIL_VERIFIED_BONUS_BPS) {
  const normalizedBaseAmount = BigInt(String(baseAmount));
  const telegramAdjustedAmount = isTelegramMember ? normalizedBaseAmount : normalizedBaseAmount / 2n;
  const normalizedBonusBps = normalizeBonusBps(emailBonusBps);
  const emailBonusAmount = isEmailVerified
    ? normalizedBaseAmount * BigInt(normalizedBonusBps) / 10000n
    : 0n;

  return {
    amount: (telegramAdjustedAmount + emailBonusAmount).toString(),
    baseAmount: normalizedBaseAmount.toString(),
    telegramAdjustedAmount: telegramAdjustedAmount.toString(),
    emailBonusAmount: emailBonusAmount.toString(),
    emailBonusBps: normalizedBonusBps,
    telegramMember: Boolean(isTelegramMember),
    emailVerified: Boolean(isEmailVerified),
  };
}

module.exports = {
  DEFAULT_EMAIL_VERIFIED_BONUS_BPS,
  calculateDailyClaimReward,
};