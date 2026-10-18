function getPendingDrawWinners(winners) {
  return (winners || []).filter((winner) => winner?.status === 'pending');
}

function isAutomaticDrawPayoutEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || 'false').trim().toLowerCase());
}

function getSettlementDrawId({ result, error } = {}) {
  if (result?.draw?.id) return result.draw.id;
  if (error?.code === 'DRAW_ALREADY_EXISTS' && error.draw?.id) return error.draw.id;
  return null;
}

async function settlePendingDrawWinners({ winners, payWinner, markPaid, onFailure }) {
  const pendingWinners = getPendingDrawWinners(winners);
  const summary = {
    attempted: pendingWinners.length,
    paid: 0,
    failed: 0,
  };

  for (const winner of pendingWinners) {
    try {
      const payout = await payWinner(winner);
      if (!payout?.paid || !payout?.txHash) {
        throw new Error('Reward transfer did not return a confirmed transaction.');
      }
      await markPaid(winner, payout);
      summary.paid += 1;
    } catch (error) {
      summary.failed += 1;
      if (onFailure) {
        await onFailure(winner, error);
      }
    }
  }

  return summary;
}

module.exports = {
  getSettlementDrawId,
  getPendingDrawWinners,
  isAutomaticDrawPayoutEnabled,
  settlePendingDrawWinners,
};
