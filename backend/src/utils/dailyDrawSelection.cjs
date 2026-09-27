const { createHash } = require('crypto');

const DAILY_DRAW_SELECTION_ALGORITHM = 'base-block-hash-weighted-sha256-v2';

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalizeEligibleClaims(claims) {
  const canonicalClaims = claims
    .map((claim) => ({
      id: Number(claim.id),
      wallet: String(claim.wallet || '').trim().toLowerCase(),
      claimedAt: new Date(claim.claimedAt).toISOString(),
      drawEntries: Math.max(1, Math.min(5, Number.parseInt(String(claim.drawEntries || '1'), 10) || 1)),
    }))
    .sort((left, right) => left.id - right.id || left.wallet.localeCompare(right.wallet));

  const uniqueByWallet = new Map();
  for (const claim of canonicalClaims) {
    if (claim.wallet && !uniqueByWallet.has(claim.wallet)) {
      uniqueByWallet.set(claim.wallet, claim);
    }
  }
  return Array.from(uniqueByWallet.values());
}

function getWeightedScore(seedHash, weight) {
  const numerator = Number.parseInt(seedHash.slice(0, 13), 16) + 1;
  const uniformValue = numerator / (0x10000000000000 + 1);
  return -Math.log(uniformValue) / weight;
}

function selectDailyDrawWinners({ claims, count, drawDate, entropyBlockHash }) {
  if (!Array.isArray(claims) || claims.length === 0) {
    throw new Error('At least one eligible claim is required.');
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('Winner count must be a positive integer.');
  }
  if (!/^0x[0-9a-f]{64}$/i.test(String(entropyBlockHash || ''))) {
    throw new Error('A valid block hash is required for draw entropy.');
  }

  const canonicalClaims = canonicalizeEligibleClaims(claims);
  const eligiblePoolHash = hash(JSON.stringify(canonicalClaims));
  const rankedClaims = canonicalClaims
    .map((claim) => {
      const seedHash = hash(`${DAILY_DRAW_SELECTION_ALGORITHM}:${entropyBlockHash.toLowerCase()}:${drawDate}:${claim.id}:${claim.wallet}`);
      return {
        claim,
        seedHash,
        score: getWeightedScore(seedHash, claim.drawEntries),
      };
    })
    .sort((left, right) => left.score - right.score || left.seedHash.localeCompare(right.seedHash) || left.claim.id - right.claim.id);

  return {
    algorithm: DAILY_DRAW_SELECTION_ALGORITHM,
    eligiblePoolHash,
    winners: rankedClaims.slice(0, Math.min(count, rankedClaims.length)).map(({ claim }) => claim),
  };
}

module.exports = {
  DAILY_DRAW_SELECTION_ALGORITHM,
  canonicalizeEligibleClaims,
  getWeightedScore,
  selectDailyDrawWinners,
};