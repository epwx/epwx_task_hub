const { selectDailyDrawWinners } = require('../src/utils/dailyDrawSelection.cjs');

const claims = [
  { id: 3, wallet: '0x0000000000000000000000000000000000000003', claimedAt: '2026-09-25T03:00:00.000Z' },
  { id: 1, wallet: '0x0000000000000000000000000000000000000001', claimedAt: '2026-09-25T01:00:00.000Z' },
  { id: 2, wallet: '0x0000000000000000000000000000000000000002', claimedAt: '2026-09-25T02:00:00.000Z' },
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
    expect(first.algorithm).toBe('base-block-hash-sha256-v1');
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
});