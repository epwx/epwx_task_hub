const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STREAK_MS = 48 * 60 * 60 * 1000;

function normalizeWallet(value) {
  return String(value || '').trim().toLowerCase();
}

function toTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function toStreakDay(value) {
  const day = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(day) && day >= 1 && day <= 7 ? day : 1;
}

function toBigInt(value) {
  try {
    return BigInt(String(value ?? '0'));
  } catch {
    return 0n;
  }
}

function percentage(numerator, denominator) {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

function calculateRetentionAnalytics({ claims = [], firstClaimByWallet = [], now = new Date() }) {
  const nowTime = toTimestamp(now);
  if (nowTime === null) {
    throw new Error('Invalid analytics timestamp');
  }

  const firstClaims = new Map();
  const firstClaimEntries = firstClaimByWallet instanceof Map
    ? Array.from(firstClaimByWallet.entries()).map(([wallet, firstClaimAt]) => ({ wallet, firstClaimAt }))
    : firstClaimByWallet;

  for (const entry of firstClaimEntries) {
    const wallet = normalizeWallet(entry.wallet);
    const firstClaimAt = toTimestamp(entry.firstClaimAt);
    if (wallet && firstClaimAt !== null) {
      firstClaims.set(wallet, firstClaimAt);
    }
  }

  const normalizedClaims = claims
    .map(claim => ({
      wallet: normalizeWallet(claim.wallet),
      claimedAt: toTimestamp(claim.claimedAt),
      streakDay: toStreakDay(claim.streakDay),
      amount: toBigInt(claim.amount),
      status: String(claim.status || '').toLowerCase(),
    }))
    .filter(claim => claim.wallet && claim.claimedAt !== null && claim.claimedAt <= nowTime)
    .sort((left, right) => left.claimedAt - right.claimedAt);

  const claimsByWallet = new Map();
  for (const claim of normalizedClaims) {
    const walletClaims = claimsByWallet.get(claim.wallet) || [];
    walletClaims.push(claim);
    claimsByWallet.set(claim.wallet, walletClaims);
  }

  const cutoff1Day = nowTime - DAY_MS;
  const cutoff7Days = nowTime - (7 * DAY_MS);
  const cutoff30Days = nowTime - (30 * DAY_MS);
  const cutoff37Days = nowTime - (37 * DAY_MS);
  const cutoff60Days = nowTime - (60 * DAY_MS);
  const activeWallets = cutoff => new Set(
    normalizedClaims.filter(claim => claim.claimedAt >= cutoff).map(claim => claim.wallet),
  );
  const dailyWallets = activeWallets(cutoff1Day);
  const weeklyWallets = activeWallets(cutoff7Days);
  const monthlyWallets = activeWallets(cutoff30Days);
  const newWallets = new Set();
  const returningWallets = new Set();

  for (const wallet of monthlyWallets) {
    const firstClaimAt = firstClaims.get(wallet);
    if (firstClaimAt !== undefined && firstClaimAt >= cutoff30Days) {
      newWallets.add(wallet);
    } else {
      returningWallets.add(wallet);
    }
  }

  function calculateReturnCohort(earliestFirstClaim, latestFirstClaim, returnWindowDays) {
    let eligible = 0;
    let returned = 0;

    for (const [wallet, firstClaimAt] of firstClaims.entries()) {
      if (firstClaimAt < earliestFirstClaim || firstClaimAt > latestFirstClaim) continue;
      eligible += 1;
      const returnDeadline = firstClaimAt + (returnWindowDays * DAY_MS);
      const didReturn = (claimsByWallet.get(wallet) || []).some(claim => (
        claim.claimedAt > firstClaimAt && claim.claimedAt <= returnDeadline
      ));
      if (didReturn) returned += 1;
    }

    return { eligible, returned, rate: percentage(returned, eligible) };
  }

  const streakDistribution = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [String(index + 1), 0]));
  let activeStreakWallets = 0;
  for (const walletClaims of claimsByWallet.values()) {
    const latestClaim = walletClaims[walletClaims.length - 1];
    if (nowTime - latestClaim.claimedAt <= ACTIVE_STREAK_MS) {
      activeStreakWallets += 1;
      streakDistribution[String(latestClaim.streakDay)] += 1;
    }
  }

  const claimsLast30Days = normalizedClaims.filter(claim => claim.claimedAt >= cutoff30Days);
  const daySevenWallets = new Set(
    claimsLast30Days.filter(claim => claim.streakDay === 7).map(claim => claim.wallet),
  );
  let repeatClaims = 0;
  let resetClaims = 0;

  for (const claim of claimsLast30Days) {
    const firstClaimAt = firstClaims.get(claim.wallet);
    if (firstClaimAt === undefined || claim.claimedAt <= firstClaimAt) continue;
    repeatClaims += 1;
    const walletClaims = claimsByWallet.get(claim.wallet) || [];
    const claimIndex = walletClaims.indexOf(claim);
    const previousClaim = claimIndex > 0 ? walletClaims[claimIndex - 1] : null;
    if (claim.streakDay === 1 && previousClaim?.streakDay !== 7) {
      resetClaims += 1;
    }
  }

  let paidToReturningWallets = 0n;
  for (const claim of claimsLast30Days) {
    if (returningWallets.has(claim.wallet) && claim.status === 'paid') {
      paidToReturningWallets += claim.amount;
    }
  }
  const averagePaidPerReturningWallet = returningWallets.size > 0
    ? paidToReturningWallets / BigInt(returningWallets.size)
    : 0n;

  return {
    generatedAt: new Date(nowTime).toISOString(),
    activity: {
      dailyActiveWallets: dailyWallets.size,
      weeklyActiveWallets: weeklyWallets.size,
      monthlyActiveWallets: monthlyWallets.size,
    },
    walletMixLast30Days: {
      newWallets: newWallets.size,
      returningWallets: returningWallets.size,
    },
    retention: {
      sevenDay: calculateReturnCohort(cutoff37Days, cutoff7Days, 7),
      thirtyDay: calculateReturnCohort(cutoff60Days, cutoff30Days, 30),
    },
    streaks: {
      activeWallets: activeStreakWallets,
      distribution: streakDistribution,
      daySevenWalletsLast30Days: daySevenWallets.size,
      daySevenCompletionRate: percentage(daySevenWallets.size, monthlyWallets.size),
      repeatClaimsLast30Days: repeatClaims,
      resetClaimsLast30Days: resetClaims,
      resetRate: percentage(resetClaims, repeatClaims),
    },
    rewards: {
      paidToReturningWalletsLast30Days: paidToReturningWallets.toString(),
      returningWallets: returningWallets.size,
      averagePaidPerReturningWallet: averagePaidPerReturningWallet.toString(),
    },
  };
}

module.exports = {
  DAY_MS,
  calculateRetentionAnalytics,
};