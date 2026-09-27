const {
  buildDailyDrawAudit,
  selectDailyDrawWinners,
} = require('../src/utils/dailyDrawSelection.cjs');

const claims = [
  { id: 3, wallet: '0x0000000000000000000000000000000000000003', claimedAt: '2026-09-25T03:00:00.000Z', drawEntries: 5 },
  { id: 1, wallet: '0x0000000000000000000000000000000000000001', claimedAt: '2026-09-25T01:00:00.000Z', drawEntries: 1 },
  { id: 2, wallet: '0x0000000000000000000000000000000000000002', claimedAt: '2026-09-25T02:00:00.000Z', drawEntries: 2 },
];

describe('Daily Reward Draw selection', () => {
  it('reproduces the same winners and pool hash from the same public inputs', () => {
    const input = {
      claims,
      count: 2,
      drawDate: '2026-09-25',
      entropyBlockHash: `0x${'ab'.repeat(32)}`,
    };

    const first = selectDailyDrawWinners(input);
    const second = selectDailyDrawWinners({ ...input, claims: [...claims].reverse() });

    expect(first).toEqual(second);
    expect(first.algorithm).toBe('base-block-hash-weighted-sha256-v2');
    expect(first.eligiblePoolHash).toMatch(/^[0-9a-f]{64}$/);
    expect(first.winners).toHaveLength(2);
  });

  it('changes the ranking when the external entropy block changes', () => {
    const first = selectDailyDrawWinners({
      claims,
      count: claims.length,
      drawDate: '2026-09-25',
      entropyBlockHash: `0x${'ab'.repeat(32)}`,
    });
    const second = selectDailyDrawWinners({
      claims,
      count: claims.length,
      drawDate: '2026-09-25',
      entropyBlockHash: `0x${'cd'.repeat(32)}`,
    });

    expect(first.winners.map((winner) => winner.id)).not.toEqual(second.winners.map((winner) => winner.id));
  });

  it('rejects invalid entropy rather than falling back to unverifiable randomness', () => {
    expect(() => selectDailyDrawWinners({
      claims,
      count: 1,
      drawDate: '2026-09-25',
      entropyBlockHash: 'invalid',
    })).toThrow('A valid block hash is required for draw entropy.');
  });

  it('changes the auditable pool hash when a wallet receives more entries', () => {
    const input = {
      claims,
      count: 1,
      drawDate: '2026-09-25',
      entropyBlockHash: `0x${'ab'.repeat(32)}`,
    };
    const standard = selectDailyDrawWinners(input);
    const reweighted = selectDailyDrawWinners({
      ...input,
      claims: claims.map((claim) => claim.id === 1 ? { ...claim, drawEntries: 5 } : claim),
    });

    expect(standard.eligiblePoolHash).not.toBe(reweighted.eligiblePoolHash);
  });

  it('allows each wallet to win at most once even if duplicate claims are supplied', () => {
    const duplicateWalletClaims = [
      ...claims,
      { id: 4, wallet: claims[0].wallet.toUpperCase(), claimedAt: '2026-09-25T04:00:00.000Z', drawEntries: 5 },
    ];
    const result = selectDailyDrawWinners({
      claims: duplicateWalletClaims,
      count: duplicateWalletClaims.length,
      drawDate: '2026-09-25',
      entropyBlockHash: `0x${'ef'.repeat(32)}`,
    });

    expect(result.winners).toHaveLength(3);
    expect(new Set(result.winners.map((winner) => winner.wallet)).size).toBe(3);
  });

  it('builds a v2 audit with the same pool hash and ranking as winner selection', () => {
    const input = {
      claims,
      count: claims.length,
      drawDate: '2026-09-25',
      entropyBlockHash: `0x${'ab'.repeat(32)}`,
    };
    const selection = selectDailyDrawWinners(input);
    const audit = buildDailyDrawAudit(input);

    expect(audit.eligiblePoolHash).toBe(selection.eligiblePoolHash);
    expect(audit.ranking.map((entry) => entry.claim.id)).toEqual(selection.winners.map((winner) => winner.id));
    expect(audit.ranking.every((entry) => Number.isFinite(entry.score))).toBe(true);
  });

  it('reproduces legacy v1 draws without including streak weights', () => {
    const input = {
      claims,
      drawDate: '2026-09-25',
      entropyBlockHash: `0x${'ab'.repeat(32)}`,
      algorithm: 'base-block-hash-sha256-v1',
    };
    const first = buildDailyDrawAudit(input);
    const reweighted = buildDailyDrawAudit({
      ...input,
      claims: claims.map((claim) => ({ ...claim, drawEntries: claim.drawEntries === 5 ? 1 : 5 })),
    });

    expect(first.eligiblePoolHash).toBe(reweighted.eligiblePoolHash);
    expect(first.ranking.map((entry) => entry.claim.id)).toEqual(reweighted.ranking.map((entry) => entry.claim.id));
    expect(first.canonicalClaims[0]).not.toHaveProperty('drawEntries');
  });

  it('rejects unsupported historical algorithms', () => {
    expect(() => buildDailyDrawAudit({
      claims,
      drawDate: '2026-09-25',
      entropyBlockHash: `0x${'ab'.repeat(32)}`,
      algorithm: 'unknown-v3',
    })).toThrow('Unsupported selection algorithm');
  });
});