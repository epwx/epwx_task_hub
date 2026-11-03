function getGrossRewardAmount(amount, feeBps = Number(process.env.EPWX_REWARD_TRANSFER_FEE_BPS || '600')) {
  const normalizedAmount = BigInt(String(amount));
  if (!Number.isFinite(feeBps) || feeBps <= 0) return normalizedAmount;
  if (feeBps >= 10_000) throw new Error('EPWX_REWARD_TRANSFER_FEE_BPS must be less than 10000.');
  const denominator = 10_000n - BigInt(feeBps);
  return (normalizedAmount * 10_000n + denominator - 1n) / denominator;
}

module.exports = { getGrossRewardAmount };
