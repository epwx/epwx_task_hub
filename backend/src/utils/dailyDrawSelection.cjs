const { createHash } = require('crypto');

const DAILY_DRAW_SELECTION_ALGORITHM = 'base-block-hash-sha256-v1';

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalizeEligibleClaims(claims) {
  return claims
    .map((claim) => ({
      id: Number(claim.id),
      wallet: String(claim.wallet || '').trim().toLowerCase(),
      claimedAt: new Date(claim.claimedAt).toISOString(),
    }))
    .sort((left, right) => left.id - right.id || left.wallet.localeCompare(right.wallet));
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
    .map((claim) => ({
      claim,
      score: hash(`${DAILY_DRAW_SELECTION_ALGORITHM}:${entropyBlockHash.toLowerCase()}:${drawDate}:${claim.id}:${claim.wallet}`),
    }))
    .sort((left, right) => left.score.localeCompare(right.score) || left.claim.id - right.claim.id);

  return {
    algorithm: DAILY_DRAW_SELECTION_ALGORITHM,
    eligiblePoolHash,
    winners: rankedClaims.slice(0, Math.min(count, rankedClaims.length)).map(({ claim }) => claim),
  };
}

module.exports = {
  DAILY_DRAW_SELECTION_ALGORITHM,
  canonicalizeEligibleClaims,
  selectDailyDrawWinners,
};