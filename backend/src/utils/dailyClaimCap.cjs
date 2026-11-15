const DEFAULT_DAILY_CLAIM_CAP_EPWX = '100000000';

function parseDailyClaimCap(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return DEFAULT_DAILY_CLAIM_CAP_EPWX;
  }

  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`Invalid daily claim cap "${value}". Expected a whole number of EPWX.`);
  }

  return BigInt(normalized).toString();
}

function calculateCappedDailyClaimAmount({ requestedAmount, reservedTodayAmount, dailyCap }) {
  const requested = BigInt(String(requestedAmount));
  const reserved = BigInt(String(reservedTodayAmount || '0'));
  const cap = BigInt(String(dailyCap));
  const remaining = cap > reserved ? cap - reserved : 0n;
  const amount = requested < remaining ? requested : remaining;

  return {
    amount: amount.toString(),
    remainingBeforeClaim: remaining.toString(),
    capped: amount < requested,
  };
}

module.exports = {
  DEFAULT_DAILY_CLAIM_CAP_EPWX,
  parseDailyClaimCap,
  calculateCappedDailyClaimAmount,
};
