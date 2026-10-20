const crypto = require('crypto');

const POST_URL = 'https://api.x.com/2/tweets';
const MAX_ATTEMPTS = 3;

function readConfig(env = process.env) {
  const enabled = env.DAILY_DRAW_X_ENABLED === 'true';
  const credentials = {
    apiKey: env.DAILY_DRAW_X_API_KEY,
    apiSecret: env.DAILY_DRAW_X_API_SECRET,
    accessToken: env.DAILY_DRAW_X_ACCESS_TOKEN,
    accessTokenSecret: env.DAILY_DRAW_X_ACCESS_TOKEN_SECRET,
  };
  if (enabled && Object.values(credentials).some((value) => !value || !value.trim())) {
    throw new Error('DAILY_DRAW_X_CREDENTIALS_MISSING');
  }
  return { enabled, credentials, frontendUrl: env.FRONTEND_URL };
}

function encode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function authorizationHeader(credentials, nonce = crypto.randomBytes(16).toString('hex'), timestamp = Math.floor(Date.now() / 1000)) {
  const parameters = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(timestamp),
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };
  const normalized = Object.keys(parameters).sort()
    .map((key) => `${encode(key)}=${encode(parameters[key])}`).join('&');
  const base = `POST&${encode(POST_URL)}&${encode(normalized)}`;
  const key = `${encode(credentials.apiSecret)}&${encode(credentials.accessTokenSecret)}`;
  parameters.oauth_signature = crypto.createHmac('sha1', key).update(base).digest('base64');
  return `OAuth ${Object.keys(parameters).sort()
    .map((name) => `${encode(name)}="${encode(parameters[name])}"`).join(', ')}`;
}

function formatAmount(value) {
  const amount = String(value);
  if (!/^\d+$/.test(amount) || BigInt(amount) <= 0n) {
    throw new Error('DAILY_DRAW_X_INVALID_PRIZE');
  }
  return BigInt(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function renderAnnouncement(draw, winners, frontendUrl) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draw.drawDate) || winners.length === 0) {
    throw new Error('DAILY_DRAW_X_INVALID_DRAW');
  }
  const header = `EPWX Daily Draw | ${draw.drawDate}\nSelected winners:`;
  const ordered = [...winners].sort((a, b) => a.rank - b.rank);
  const lines = ordered.map((winner) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(winner.wallet)) {
      throw new Error('DAILY_DRAW_X_INVALID_WALLET');
    }
    // No recorded mention-consent mechanism exists, so never use linked usernames.
    return `${winner.wallet.slice(0, 6)}...${winner.wallet.slice(-4)}: ${formatAmount(winner.prizeAmount)} EPWX`;
  });
  const detailed = [header, ...lines].join('\n');
  if (detailed.length <= 280) return detailed;

  if (!frontendUrl) throw new Error('DAILY_DRAW_X_RESULTS_URL_REQUIRED');
  const url = new URL(frontendUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('DAILY_DRAW_X_INVALID_RESULTS_URL');
  }
  url.pathname = '/';
  url.search = '';
  url.hash = 'latest-winners';
  const total = ordered.reduce((sum, winner) => sum + BigInt(winner.prizeAmount), 0n);
  const summary = `EPWX Daily Draw | ${draw.drawDate}\n${winners.length} winners selected.\nTotal prizes: ${formatAmount(total)} EPWX\nFull results (browse by draw date):\n`;
  // X shortens HTTPS/HTTP URLs to 23 weighted characters. All other output is ASCII.
  if (summary.length + 23 > 280) throw new Error('DAILY_DRAW_X_CONTENT_TOO_LONG');
  return summary + url.href;
}

function classifyFailure(error, now) {
  const status = error.response?.status;
  if (status === 429) {
    const headers = error.response.headers || {};
    const retryAfter = headers['retry-after'];
    const seconds = /^\d+$/.test(String(retryAfter)) ? Number(retryAfter) * 1000 : 0;
    const dateDelay = seconds ? 0 : Date.parse(retryAfter) - now.getTime();
    const resetDelay = Number(headers['x-rate-limit-reset']) * 1000 - now.getTime();
    return {
      status: 'failed',
      errorCode: 'X_HTTP_429',
      retryable: true,
      delay: Math.max(60_000, seconds || 0, dateDelay || 0, resetDelay || 0),
    };
  }
  if (status >= 400 && status < 500 && status !== 408) {
    return { status: 'failed', errorCode: `X_HTTP_${status}`, retryable: false };
  }
  // Network errors, 408s, and server errors do not prove that X did not create the post.
  return { status: 'uncertain', errorCode: 'X_OUTCOME_UNCERTAIN', retryable: false };
}

function createDispatcher({ repository, post, config, logger = console, now = () => new Date() }) {
  return async function dispatch(drawId) {
    if (!config.enabled) return { status: 'disabled' };
    try {
      const data = await repository.loadDraw(drawId);
      if (!data || data.draw.status !== 'completed' || data.winners.length === 0) {
        return { status: 'skipped' };
      }
      const record = await repository.ensure(drawId);
      if (!['pending', 'failed'].includes(record.status) ||
          (record.status === 'failed' && !record.nextAttemptAt) ||
          record.attempts >= MAX_ATTEMPTS ||
          (record.nextAttemptAt && new Date(record.nextAttemptAt) > now())) {
        return { status: record.status };
      }
      let text;
      try {
        text = renderAnnouncement(data.draw, data.winners, config.frontendUrl);
      } catch {
        await repository.reject(record, 'X_CONTENT_INVALID');
        logger.error(`[daily-draw-x] draw=${drawId} X_CONTENT_INVALID; fix content/configuration before recovery`);
        return { status: 'failed', errorCode: 'X_CONTENT_INVALID' };
      }
      const claimed = await repository.claim(record);
      if (!claimed) return { status: 'busy' };

      let response;
      try {
        response = await post(text, config.credentials);
      } catch (error) {
        const failure = classifyFailure(error, now());
        const attempts = record.attempts + 1;
        const nextAttemptAt = failure.retryable && attempts < MAX_ATTEMPTS
          ? new Date(now().getTime() + Math.max(failure.delay, 60_000 * (2 ** (attempts - 1))))
          : null;
        await repository.finish(record.id, {
          status: failure.status, errorCode: failure.errorCode, nextAttemptAt,
        });
        logger.error(`[daily-draw-x] draw=${drawId} ${failure.errorCode}; status=${failure.status}`);
        return { status: failure.status };
      }

      const postId = response?.data?.data?.id;
      if (typeof postId !== 'string' || !/^\d+$/.test(postId)) {
        await repository.finish(record.id, {
          status: 'uncertain', errorCode: 'X_INVALID_RESPONSE', nextAttemptAt: null,
        });
        logger.error(`[daily-draw-x] draw=${drawId} X_INVALID_RESPONSE; reconciliation required`);
        return { status: 'uncertain' };
      }
      // A failed DB write leaves the durable "sending" state, never a retryable state.
      await repository.finish(record.id, {
        status: 'published', postId, publishedAt: now(), errorCode: null, nextAttemptAt: null,
      });
      logger.log(`[daily-draw-x] draw=${drawId} published post=${postId}`);
      return { status: 'published', postId };
    } catch {
      logger.error(`[daily-draw-x] draw=${drawId} DISPATCH_FAILED; inspect announcement state before recovery`);
      return { status: 'error', errorCode: 'DISPATCH_FAILED' };
    }
  };
}

module.exports = {
  POST_URL, MAX_ATTEMPTS, readConfig, authorizationHeader, renderAnnouncement,
  classifyFailure, createDispatcher,
};
