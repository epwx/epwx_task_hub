const {
  getSettlementDrawId,
  getPendingDrawWinners,
  isAutomaticDrawPayoutEnabled,
  settlePendingDrawWinners,
} = require('../src/utils/dailyDrawPayout.cjs');

describe('Daily Reward Draw automatic payouts', () => {
  it('keeps automatic payout disabled by default and recognizes explicit enablement', () => {
    expect(isAutomaticDrawPayoutEnabled(undefined)).toBe(false);
    expect(isAutomaticDrawPayoutEnabled('false')).toBe(false);
    expect(isAutomaticDrawPayoutEnabled('true')).toBe(true);
    expect(isAutomaticDrawPayoutEnabled('1')).toBe(true);
  });

  it('selects new and existing draw ids for settlement', () => {
    expect(getSettlementDrawId({ result: { draw: { id: 10 } } })).toBe(10);
    expect(getSettlementDrawId({
      error: { code: 'DRAW_ALREADY_EXISTS', draw: { id: 11 } },
    })).toBe(11);
    expect(getSettlementDrawId({ error: { code: 'NO_ELIGIBLE_CLAIMS' } })).toBeNull();
  });

  it('selects only pending winners', () => {
    const winners = [
      { id: 1, status: 'pending' },
      { id: 2, status: 'paid' },
      { id: 3, status: 'pending' },
    ];
    expect(getPendingDrawWinners(winners).map((winner) => winner.id)).toEqual([1, 3]);
  });

  it('stores successful payouts and continues after a failed winner', async () => {
    const winners = [
      { id: 1, status: 'pending' },
      { id: 2, status: 'paid' },
      { id: 3, status: 'pending' },
    ];
    const markedPaid = [];
    const failures = [];

    const summary = await settlePendingDrawWinners({
      winners,
      payWinner: async (winner) => {
        if (winner.id === 1) throw new Error('temporary RPC failure');
        return { paid: true, txHash: '0xconfirmed' };
      },
      markPaid: async (winner, payout) => {
        winner.status = 'paid';
        winner.txHash = payout.txHash;
        winner.paidAt = new Date('2026-10-18T00:05:00.000Z');
        markedPaid.push(winner.id);
      },
      onFailure: async (winner) => {
        failures.push(winner.id);
      },
    });

    expect(summary).toEqual({ attempted: 2, paid: 1, failed: 1 });
    expect(markedPaid).toEqual([3]);
    expect(failures).toEqual([1]);
    expect(winners[0].status).toBe('pending');
    expect(winners[1].status).toBe('paid');
    expect(winners[2]).toMatchObject({ status: 'paid', txHash: '0xconfirmed' });
  });

  it('leaves an unconfirmed transfer pending', async () => {
    const winner = { id: 1, status: 'pending' };
    const summary = await settlePendingDrawWinners({
      winners: [winner],
      payWinner: async () => ({ paid: false, txHash: null }),
      markPaid: async () => {
        throw new Error('markPaid must not be called');
      },
    });

    expect(summary).toEqual({ attempted: 1, paid: 0, failed: 1 });
    expect(winner.status).toBe('pending');
  });
});
