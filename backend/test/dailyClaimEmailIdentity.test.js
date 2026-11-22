const {
  normalizeEmailIdentity,
  selectEmailOwner,
  isEmailOwner,
} = require('../src/utils/dailyClaimEmailIdentity.cjs');

describe('Daily Claim email identity', () => {
  it('normalizes email addresses for consistent linkage', () => {
    expect(normalizeEmailIdentity('  User@Example.COM ')).toBe('user@example.com');
  });

  it('keeps the earliest existing wallet as owner for legacy duplicate data', () => {
    const preferences = [
      {
        id: 'b',
        wallet: '0x2222222222222222222222222222222222222222',
        email: 'user@example.com',
        createdAt: '2026-10-02T00:00:00.000Z',
      },
      {
        id: 'a',
        wallet: '0x1111111111111111111111111111111111111111',
        email: 'user@example.com',
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ];

    expect(selectEmailOwner(preferences)?.wallet)
      .toBe('0x1111111111111111111111111111111111111111');
    expect(isEmailOwner(preferences, '0x1111111111111111111111111111111111111111')).toBe(true);
    expect(isEmailOwner(preferences, '0x2222222222222222222222222222222222222222')).toBe(false);
  });

  it('uses the stable id when legacy timestamps are equal', () => {
    const preferences = [
      { id: 'z', wallet: '0x2', email: 'same@example.com', createdAt: '2026-10-01T00:00:00.000Z' },
      { id: 'a', wallet: '0x1', email: 'same@example.com', createdAt: '2026-10-01T00:00:00.000Z' },
    ];
    expect(selectEmailOwner(preferences)?.wallet).toBe('0x1');
  });

  it('does not authorize a wallet when no linkage exists', () => {
    expect(isEmailOwner([], '0x1111111111111111111111111111111111111111')).toBe(false);
  });
});
