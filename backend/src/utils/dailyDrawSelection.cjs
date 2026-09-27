const { createHash } = require('crypto');

const LEGACY_DAILY_DRAW_SELECTION_ALGORITHM = 'base-block-hash-sha256-v1';
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

function canonicalizeLegacyEligibleClaims(claims) {
  return claims
    .map((claim) => ({
      id: Number(claim.id),
      wallet: String(claim.wallet || '').trim().toLowerCase(),
      claimedAt: new Date(claim.claimedAt).toISOString(),
    }))
    .sort((left, right) => left.id - right.id || left.wallet.localeCompare(right.wallet));
}

function getWeightedScore(seedHash, weight) {
  const numerator = Number.parseInt(seedHash.slice(0, 13), 16) + 1;
  const uniformValue = numerator / (0x10000000000000 + 1);
  return -Math.log(uniformValue) / weight;
}

function buildDailyDrawAudit({ claims, drawDate, entropyBlockHash, algorithm = DAILY_DRAW_SELECTION_ALGORITHM }) {
  if (!Array.isArray(claims) || claims.length === 0) {
    throw new Error('At least one eligible claim is required.');
  }
  if (!/^0x[0-9a-f]{64}$/i.test(String(entropyBlockHash || ''))) {
    throw new Error('A valid block hash is required for draw entropy.');
  }
  if (![LEGACY_DAILY_DRAW_SELECTION_ALGORITHM, DAILY_DRAW_SELECTION_ALGORITHM].includes(algorithm)) {
    throw new Error(`Unsupported selection algorithm: ${algorithm}`);
  }

  const weighted = algorithm === DAILY_DRAW_SELECTION_ALGORITHM;
  const canonicalClaims = weighted
    ? canonicalizeEligibleClaims(claims)
    : canonicalizeLegacyEligibleClaims(claims);
  const eligiblePoolHash = hash(JSON.stringify(canonicalClaims));
  const ranking = canonicalClaims
    .map((claim) => {
      const seedInput = `${algorithm}:${entropyBlockHash.toLowerCase()}:${drawDate}:${claim.id}:${claim.wallet}`;
      const seedHash = hash(seedInput);
      return {
        claim,
        seedInput,
        seedHash,
        score: weighted ? getWeightedScore(seedHash, claim.drawEntries) : seedHash,
      };
    })
    .sort((left, right) => {
      if (weighted) {
        return left.score - right.score || left.seedHash.localeCompare(right.seedHash) || left.claim.id - right.claim.id;
      }
      return left.seedHash.localeCompare(right.seedHash) || left.claim.id - right.claim.id;
    });

  return { algorithm, eligiblePoolHash, canonicalClaims, ranking };
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

  const audit = buildDailyDrawAudit({ claims, drawDate, entropyBlockHash });

  return {
    algorithm: DAILY_DRAW_SELECTION_ALGORITHM,
    eligiblePoolHash: audit.eligiblePoolHash,
    winners: audit.ranking.slice(0, Math.min(count, audit.ranking.length)).map(({ claim }) => claim),
  };
}

module.exports = {
  LEGACY_DAILY_DRAW_SELECTION_ALGORITHM,
  DAILY_DRAW_SELECTION_ALGORITHM,
  canonicalizeEligibleClaims,
  canonicalizeLegacyEligibleClaims,
  buildDailyDrawAudit,
  getWeightedScore,
  selectDailyDrawWinners,
};