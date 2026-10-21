const crypto = require('crypto');
const { parseTweet } = require('twitter-text');

const POST_URL = 'https://api.x.com/2/tweets';
const MEDIA_URL = 'https://api.x.com/2/media/upload';
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
  const scheduledTime = env.AUTO_DAILY_DRAW_TIME_UTC || '00:05';
  const schedulerEnabled = ['1', 'true', 'yes', 'on'].includes(String(env.AUTO_DAILY_DRAW_ENABLED).toLowerCase());
  const nextDrawTime = schedulerEnabled && /^([01]\d|2[0-3]):[0-5]\d$/.test(scheduledTime)
    ? scheduledTime : null;
  return {
    enabled, credentials, frontendUrl: env.FRONTEND_URL, nextDrawTime,
    deletePrevious: enabled && env.DAILY_DRAW_X_DELETE_PREVIOUS === 'true',
  };
}

function encode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function authorizationHeader(credentials, nonce = crypto.randomBytes(16).toString('hex'), timestamp = Math.floor(Date.now() / 1000), url = POST_URL, method = 'POST') {
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
  const base = `${method}&${encode(url)}&${encode(normalized)}`;
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

function announcementDetails(draw, winners, frontendUrl) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draw.drawDate) || winners.length === 0) {
    throw new Error('DAILY_DRAW_X_INVALID_DRAW');
  }
  const ordered = [...winners].sort((a, b) => a.rank - b.rank);
  const rows = ordered.map((winner) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(winner.wallet) || !Number.isSafeInteger(winner.rank) || winner.rank <= 0) {
      throw new Error('DAILY_DRAW_X_INVALID_WALLET');
    }
    // No recorded mention-consent mechanism exists, so never use linked usernames.
    return {
      rank: winner.rank,
      wallet: `${winner.wallet.slice(0, 8)}...${winner.wallet.slice(-6)}`,
      prize: formatAmount(winner.prizeAmount),
      paid: winner.status === 'paid' && /^0x[a-fA-F0-9]{64}$/.test(winner.txHash || '') &&
        Boolean(winner.paidAt) && Number.isFinite(new Date(winner.paidAt).getTime()),
    };
  });
  if (!frontendUrl) throw new Error('DAILY_DRAW_X_RESULTS_URL_REQUIRED');
  const url = new URL(frontendUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('DAILY_DRAW_X_INVALID_RESULTS_URL');
  }
  url.pathname = '/';
  url.search = '';
  url.hash = 'latest-winners';
  const total = ordered.reduce((sum, winner) => sum + BigInt(winner.prizeAmount), 0n);
  return {
    date: draw.drawDate, rows, total: formatAmount(total), resultsUrl: url.href,
    paidCount: rows.filter((row) => row.paid).length,
    equalPrizes: rows.every((row) => row.prize === rows[0].prize),
  };
}

function renderAnnouncement(draw, winners, frontendUrl, nextDrawTime) {
  const details = announcementDetails(draw, winners, frontendUrl);
  const { rows, paidCount, resultsUrl } = details;
  const prize = details.equalPrizes ? `${rows[0].prize} EPWX each` : `${details.total} EPWX in prizes`;
  const payment = paidCount === rows.length ? 'All payouts confirmed!'
    : paidCount ? `${paidCount}/${rows.length} payouts confirmed; others pending.` : 'Selected; payouts pending.';
  const lines = [
    `\u{1F389} EPWX Daily Draw | ${details.date} \u{1F3C6}`,
    `Congratulations to our ${rows.length} winners on Base!`,
    `${prize}. ${payment}`,
    ...(nextDrawTime ? [`Next draw: ${nextDrawTime} UTC`] : []),
    `\u{1F449} Claim daily & results (eligibility rules apply): ${resultsUrl}`,
    '#EPWX #Base #DailyDraw #CryptoRewards #Winners',
  ];
  let text = lines.join('\n');
  if (!parseTweet(text).valid) {
    text = [
      `\u{1F389} EPWX Daily Draw | ${details.date} \u{1F3C6}`,
      `Congratulations to our ${rows.length} winners!`,
      payment,
      `Claim & full results (eligibility rules apply): ${resultsUrl}`,
      '#EPWX #Base #DailyDraw #Winners',
    ].join('\n');
  }
  if (!parseTweet(text).valid) throw new Error('DAILY_DRAW_X_CONTENT_TOO_LONG');
  return text;
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

function createDispatcher({ repository, renderImage, upload, post, config, logger = console, now = () => new Date() }) {
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
        text = renderAnnouncement(data.draw, data.winners, config.frontendUrl, config.nextDrawTime);
      } catch {
        await repository.reject(record, 'X_CONTENT_INVALID');
        logger.error(`[daily-draw-x] draw=${drawId} X_CONTENT_INVALID; fix content/configuration before recovery`);
        return { status: 'failed', errorCode: 'X_CONTENT_INVALID' };
      }
      const claimed = await repository.claim(record);
      if (!claimed) return { status: 'busy' };

      let image;
      try {
        image = await renderImage(data.draw, data.winners, config);
      } catch {
        await repository.finish(record.id, {
          status: 'failed', errorCode: 'X_IMAGE_RENDER_FAILED', nextAttemptAt: null,
        });
        logger.error(`[daily-draw-x] draw=${drawId} X_IMAGE_RENDER_FAILED; no post sent`);
        return { status: 'failed' };
      }

      let mediaId;
      try {
        mediaId = await upload(image, config.credentials);
        if (typeof mediaId !== 'string' || !/^\d+$/.test(mediaId)) {
          throw new Error('X_MEDIA_INVALID_RESPONSE');
        }
      } catch (error) {
        const failure = classifyFailure(error, now());
        // An upload cannot publish a post, so ambiguous upload outcomes are safe to retry.
        const retryable = failure.retryable || failure.status === 'uncertain';
        const attempts = record.attempts + 1;
        const nextAttemptAt = retryable && attempts < MAX_ATTEMPTS
          ? new Date(now().getTime() + Math.max(failure.delay || 0, 60_000 * (2 ** (attempts - 1))))
          : null;
        const errorCode = ['X_MEDIA_INVALID_RESPONSE', 'X_MEDIA_NOT_READY'].includes(error.message)
          ? error.message : failure.errorCode.replace(/^X_/, 'X_MEDIA_');
        await repository.finish(record.id, { status: 'failed', errorCode, nextAttemptAt });
        logger.error(`[daily-draw-x] draw=${drawId} ${errorCode}; no post sent`);
        return { status: 'failed' };
      }

      let response;
      try {
        response = await post(text, config.credentials, mediaId);
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
  POST_URL, MEDIA_URL, MAX_ATTEMPTS, readConfig, authorizationHeader, renderAnnouncement, announcementDetails,
  classifyFailure, createDispatcher,
};
