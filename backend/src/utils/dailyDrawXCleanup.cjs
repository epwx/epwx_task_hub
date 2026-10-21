const { classifyFailure } = require('./dailyDrawX.cjs');

const POSTS_URL = 'https://api.x.com/2/tweets';
const MAX_DELETE_ATTEMPTS = 3;

function deleteUrl(postId) {
  if (!/^\d+$/.test(String(postId))) throw new Error('DAILY_DRAW_X_INVALID_POST_ID');
  return `${POSTS_URL}/${postId}`;
}

// Only tracked announcements older than the newest live tracked announcement are eligible.
function selectSuperseded(records) {
  const live = records
    .filter((record) => record.status === 'published' && /^\d+$/.test(record.postId || '') &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.draw?.drawDate || '') && record.deleteStatus !== 'deleted')
    .sort((a, b) => b.draw.drawDate.localeCompare(a.draw.drawDate));
  if (live.length === 0) return [];
  return live.filter((record) => record.draw.drawDate < live[0].draw.drawDate);
}

function isDue(record, now) {
  if (!record.deleteStatus) return true;
  return record.deleteStatus === 'failed' && Boolean(record.deleteNextAttemptAt) &&
    new Date(record.deleteNextAttemptAt) <= now && (record.deleteAttempts || 0) < MAX_DELETE_ATTEMPTS;
}

function createCleanup({ repository, remove, config, logger = console, now = () => new Date() }) {
  return async function cleanup() {
    if (!config.enabled || !config.deletePrevious) return { status: 'disabled', deleted: 0 };
    let deleted = 0;
    const candidates = selectSuperseded(await repository.listPublished()).filter((record) => isDue(record, now()));
    for (const record of candidates) {
      if (!(await repository.claimDelete(record))) continue;
      const attempts = (record.deleteAttempts || 0) + 1;
      try {
        const response = await remove(record.postId, config.credentials);
        if (response?.data?.data?.deleted !== true) throw new Error('X_DELETE_NOT_CONFIRMED');
        await repository.finishDelete(record.id, { deleteStatus: 'deleted', deletedAt: now(), deleteErrorCode: null, deleteNextAttemptAt: null });
        deleted += 1;
        logger.log(`[daily-draw-x] deleted superseded announcement draw=${record.drawId} post=${record.postId}`);
      } catch (error) {
        if (error.response?.status === 404) {
          await repository.finishDelete(record.id, { deleteStatus: 'deleted', deletedAt: now(), deleteErrorCode: null, deleteNextAttemptAt: null });
          deleted += 1;
          logger.log(`[daily-draw-x] superseded announcement already absent draw=${record.drawId}`);
          continue;
        }
        const failure = classifyFailure(error, now());
        // Deletion is idempotent, so unknown outcomes can safely be retried.
        const retryable = failure.retryable || failure.status === 'uncertain';
        const code = error.message === 'X_DELETE_NOT_CONFIRMED' ? error.message
          : failure.status === 'uncertain' ? 'X_DELETE_OUTCOME_UNCERTAIN' : failure.errorCode.replace(/^X_/, 'X_DELETE_');
        const nextAttemptAt = retryable && attempts < MAX_DELETE_ATTEMPTS
          ? new Date(now().getTime() + Math.max(failure.delay || 0, 60_000 * (2 ** (attempts - 1)))) : null;
        await repository.finishDelete(record.id, { deleteStatus: 'failed', deleteErrorCode: code, deleteNextAttemptAt: nextAttemptAt });
        logger.error(`[daily-draw-x] draw=${record.drawId} ${code}; superseded announcement kept`);
      }
    }
    return { status: 'complete', deleted };
  };
}

module.exports = { POSTS_URL, MAX_DELETE_ATTEMPTS, deleteUrl, selectSuperseded, isDue, createCleanup };
