const crypto = require('crypto');
const { parseTweet } = require('twitter-text');
const {
  POST_URL, MEDIA_URL, readConfig, authorizationHeader, renderAnnouncement, announcementDetails, classifyFailure, createDispatcher,
} = require('../src/utils/dailyDrawX.cjs');

const date = new Date('2026-10-20T00:05:00.000Z');
const credentials = {
  apiKey: 'test-consumer', apiSecret: 'test-consumer-secret',
  accessToken: 'test-user', accessTokenSecret: 'test-user-secret',
};
const config = { enabled: true, credentials, frontendUrl: 'https://tasks.example.com' };
const draw = { id: 10, drawDate: '2026-10-19', status: 'completed' };
const makeWinner = (rank = 1, prizeAmount = '100000') => ({
  wallet: `0x${String(rank).padStart(40, '0')}`, rank, prizeAmount, status: 'pending',
  twitterUsername: 'shouldNeverBeMentioned',
});

function fixture(options = {}) {
  const state = {
    id: 1, drawId: 10, status: 'pending', attempts: 0, nextAttemptAt: null, ...options.record,
  };
  const repository = {
    loadDraw: jest.fn(async () => ({ draw, winners: options.winners || [makeWinner()] })),
    ensure: jest.fn(async () => ({ ...state })),
    claim: jest.fn(async (record) => {
      if (state.status !== record.status || state.attempts !== record.attempts) return false;
      Object.assign(state, { status: 'sending', attempts: record.attempts + 1, nextAttemptAt: null });
      return true;
    }),
    reject: jest.fn(async (record, errorCode) => {
      if (state.status === record.status && state.attempts === record.attempts) {
        Object.assign(state, { status: 'failed', errorCode, nextAttemptAt: null });
      }
    }),
    finish: jest.fn(async (id, values) => {
      if (state.status !== 'sending') throw new Error('invalid transition');
      Object.assign(state, values);
    }),
  };
  const renderImage = jest.fn(async () => Buffer.from('test-png'));
  const upload = jest.fn(async () => '55555');
  const post = jest.fn(async () => ({ data: { data: { id: '123456789' } } }));
  const logger = { error: jest.fn(), log: jest.fn() };
  const dispatch = createDispatcher({
    repository, renderImage, upload, post, logger, now: () => date, config: options.config || config,
  });
  return { dispatch, state, repository, renderImage, upload, post, logger };
}

describe('daily draw X configuration and signing', () => {
  test('requires explicit true and credentials only when enabled', () => {
    for (const flag of [undefined, 'false', '1', 'yes', 'TRUE']) {
      expect(readConfig({ DAILY_DRAW_X_ENABLED: flag }).enabled).toBe(false);
    }
    expect(() => readConfig({ DAILY_DRAW_X_ENABLED: 'true' })).toThrow('DAILY_DRAW_X_CREDENTIALS_MISSING');
    expect(readConfig({
      DAILY_DRAW_X_ENABLED: 'true', DAILY_DRAW_X_API_KEY: 'key', DAILY_DRAW_X_API_SECRET: 'secret',
      DAILY_DRAW_X_ACCESS_TOKEN: 'token', DAILY_DRAW_X_ACCESS_TOKEN_SECRET: 'token-secret',
    })).toMatchObject({ enabled: true, credentials: { apiKey: 'key', accessToken: 'token' } });
  });

  test('signs the exact POST endpoint with OAuth 1.0a and excludes JSON body parameters', () => {
    const header = authorizationHeader(credentials, 'fixednonce', 1792454700);
    const fields = Object.fromEntries([...header.matchAll(/(oauth_\w+)="([^"]*)"/g)]
      .map((match) => [match[1], decodeURIComponent(match[2])]));
    const signature = fields.oauth_signature;
    delete fields.oauth_signature;
    const params = new URLSearchParams(Object.entries(fields).sort());
    const base = ['POST', POST_URL, params.toString()].map(encodeURIComponent).join('&');
    expect(signature).toBe(crypto.createHmac('sha1', 'test-consumer-secret&test-user-secret').update(base).digest('base64'));
    expect(fields).toMatchObject({ oauth_consumer_key: 'test-consumer', oauth_token: 'test-user' });
    expect(header).not.toContain('test-user-secret');
    expect(header).not.toContain('test-consumer-secret');
  });

  test('percent-encodes credential punctuation according to OAuth rules', () => {
    const header = authorizationHeader({ ...credentials, apiKey: "a!'()*", accessToken: 'a b+c' }, 'nonce', 1);
    expect(header).toContain('oauth_consumer_key="a%21%27%28%29%2A"');
    expect(header).toContain('oauth_token="a%20b%2Bc"');
  });

  test('signs media upload against its own URL rather than the create-post endpoint', () => {
    const post = authorizationHeader(credentials, 'fixednonce', 123);
    const media = authorizationHeader(credentials, 'fixednonce', 123, MEDIA_URL);
    expect(media).not.toBe(post);
    const params = [
      'oauth_consumer_key=test-consumer', 'oauth_nonce=fixednonce',
      'oauth_signature_method=HMAC-SHA1', 'oauth_timestamp=123',
      'oauth_token=test-user', 'oauth_version=1.0',
    ].join('&');
    const base = ['POST', MEDIA_URL, params].map(encodeURIComponent).join('&');
    const signature = crypto.createHmac('sha1', 'test-consumer-secret&test-user-secret').update(base).digest('base64');
    expect(media).toContain(`oauth_signature="${encodeURIComponent(signature)}"`);
  });

  test('only advertises the configured draw time when automatic draws are enabled', () => {
    expect(readConfig({}).nextDrawTime).toBeNull();
    expect(readConfig({ AUTO_DAILY_DRAW_ENABLED: 'true' }).nextDrawTime).toBe('00:05');
    expect(readConfig({ AUTO_DAILY_DRAW_ENABLED: 'true', AUTO_DAILY_DRAW_TIME_UTC: '14:30' }).nextDrawTime).toBe('14:30');
    expect(readConfig({ AUTO_DAILY_DRAW_ENABLED: 'true', AUTO_DAILY_DRAW_TIME_UTC: '25:70' }).nextDrawTime).toBeNull();
  });
});

describe('daily draw X announcement content', () => {
  test('renders celebratory text, claim link, hashtags, and truthful pending status within X weighted length', () => {
    const winners = Array.from({ length: 5 }, (_, index) => makeWinner(index + 1));
    const text = renderAnnouncement(draw, winners, config.frontendUrl);
    expect(parseTweet(text).valid).toBe(true);
    expect(parseTweet(text).weightedLength).toBeLessThanOrEqual(280);
    expect(text).toContain('2026-10-19');
    expect(text).toContain('Congratulations to our 5 winners');
    expect(text).toContain('100,000 EPWX each');
    expect(text).toContain('payouts pending');
    expect(text).toContain('https://tasks.example.com/#latest-winners');
    expect(text).toContain('#EPWX #Base #DailyDraw');
    expect(text).not.toMatch(/@|shouldNeverBeMentioned|all payouts confirmed|auto-eligible|\*\*/i);
    for (const winner of winners) expect(text).not.toContain(winner.wallet);
  });

  test('orders winners by rank without mutating input and preserves integer precision', () => {
    const winners = [makeWinner(2, '999999999999999999999'), makeWinner(1)];
    const details = announcementDetails(draw, winners, config.frontendUrl);
    expect(details.rows.map((row) => row.rank)).toEqual([1, 2]);
    expect(details.rows[1].prize).toBe('999,999,999,999,999,999,999');
    expect(details.total).toBe('1,000,000,000,000,000,099,999');
    expect(winners[0].rank).toBe(2);
  });

  test('large draws use a bounded caption with exact totals and a results board link', () => {
    const winners = Array.from({ length: 50 }, (_, index) => makeWinner(index + 1));
    const text = renderAnnouncement(draw, winners, 'https://tasks.example.com/somewhere?x=1');
    expect(text).toContain('50 winners');
    expect(text).toContain('100,000 EPWX each');
    expect(text).toContain('https://tasks.example.com/#latest-winners');
    expect(parseTweet(text).valid).toBe(true);
    expect(announcementDetails(draw, winners, config.frontendUrl).total).toBe('5,000,000');
  });

  test('paid labels require stored paid status, transaction hash, and payment timestamp', () => {
    const paid = {
      ...makeWinner(), status: 'paid', txHash: `0x${'1'.repeat(64)}`, paidAt: date,
    };
    expect(renderAnnouncement(draw, [paid], config.frontendUrl)).toContain('All payouts confirmed!');
    for (const missing of [{ txHash: null }, { paidAt: null }, { paidAt: 'invalid' }, { status: 'pending' }]) {
      expect(renderAnnouncement(draw, [{ ...paid, ...missing }], config.frontendUrl)).toContain('payouts pending');
    }
    const mixed = renderAnnouncement(draw, [paid, makeWinner(2)], config.frontendUrl);
    expect(mixed).toContain('1/2 payouts confirmed; others pending.');
    expect(mixed).not.toContain('All payouts confirmed');
  });

  test('caption remains within weighted length for long amounts, mixed payouts, emojis, and long URLs', () => {
    const text = renderAnnouncement(draw, [
      makeWinner(1, '9'.repeat(90)), makeWinner(2, '8'.repeat(90)),
    ], `https://tasks.example.com/${'path'.repeat(100)}`, '00:05');
    expect(parseTweet(text).valid).toBe(true);
    expect(text).toContain('Claim & full results');
    expect(text).not.toContain('9'.repeat(90));
    expect(renderAnnouncement(draw, [makeWinner()], config.frontendUrl, '14:30')).toContain('Next draw: 14:30 UTC');
  });

  test('never silently truncates invalid content or oversized results without a link', () => {
    expect(() => renderAnnouncement(draw, [makeWinner(1, '0')])).toThrow('INVALID_PRIZE');
    expect(() => renderAnnouncement(draw, [{ ...makeWinner(), wallet: '@someone' }])).toThrow('INVALID_WALLET');
    const winners = Array.from({ length: 50 }, (_, index) => makeWinner(index + 1));
    expect(() => renderAnnouncement(draw, winners)).toThrow('RESULTS_URL_REQUIRED');
    expect(() => renderAnnouncement(draw, winners, 'javascript:alert(1)')).toThrow('INVALID_RESULTS_URL');
    expect(() => renderAnnouncement(draw, winners, 'https://user:password@example.com')).toThrow('INVALID_RESULTS_URL');
  });
});

describe('daily draw X durable dispatch', () => {
  test('disabled dispatch makes no storage or X requests, including failed retries', async () => {
    const f = fixture({ config: { enabled: false }, record: { status: 'failed', nextAttemptAt: date } });
    expect(await f.dispatch(10)).toEqual({ status: 'disabled' });
    expect(f.repository.loadDraw).not.toHaveBeenCalled();
    expect(f.post).not.toHaveBeenCalled();
  });

  test('publishes pending winners, persists confirmation, and skips a second dispatch', async () => {
    const f = fixture();
    expect(await f.dispatch(10)).toEqual({ status: 'published', postId: '123456789' });
    expect(f.post).toHaveBeenCalledWith(expect.stringContaining('Congratulations'), credentials, '55555');
    expect(f.renderImage).toHaveBeenCalledTimes(1);
    expect(f.upload).toHaveBeenCalledWith(Buffer.from('test-png'), credentials);
    expect(f.state).toMatchObject({ status: 'published', attempts: 1, postId: '123456789', publishedAt: date });
    await f.dispatch(10);
    expect(f.post).toHaveBeenCalledTimes(1);
    expect(f.upload).toHaveBeenCalledTimes(1);
  });

  test('concurrent dispatchers claim only one post', async () => {
    const f = fixture();
    await Promise.all([f.dispatch(10), f.dispatch(10), f.dispatch(10)]);
    expect(f.post).toHaveBeenCalledTimes(1);
    expect(f.upload).toHaveBeenCalledTimes(1);
    expect(f.state.status).toBe('published');
  });

  test.each(['sending', 'uncertain', 'published'])('never reposts a %s record', async (status) => {
    const f = fixture({ record: { status } });
    await f.dispatch(10);
    expect(f.post).not.toHaveBeenCalled();
  });

  test('skips missing, incomplete, and empty draws', async () => {
    const f = fixture({ winners: [] });
    await f.dispatch(10);
    f.repository.loadDraw.mockResolvedValueOnce(null);
    await f.dispatch(10);
    f.repository.loadDraw.mockResolvedValueOnce({ draw: { ...draw, status: 'pending' }, winners: [makeWinner()] });
    await f.dispatch(10);
    expect(f.repository.ensure).not.toHaveBeenCalled();
    expect(f.post).not.toHaveBeenCalled();
  });

  test('backs off confirmed rate-limit rejections, honors headers, and caps automatic attempts at three', async () => {
    const f = fixture();
    f.post.mockRejectedValue({ response: { status: 429, headers: { 'retry-after': '120' } } });
    expect(await f.dispatch(10)).toEqual({ status: 'failed' });
    expect(f.state.nextAttemptAt).toEqual(new Date(date.getTime() + 120_000));
    await f.dispatch(10);
    expect(f.post).toHaveBeenCalledTimes(1);
    f.state.nextAttemptAt = date;
    await f.dispatch(10);
    expect(f.state.attempts).toBe(2);
    f.state.nextAttemptAt = date;
    await f.dispatch(10);
    expect(f.state).toMatchObject({ attempts: 3, status: 'failed', nextAttemptAt: null });
    await f.dispatch(10);
    expect(f.post).toHaveBeenCalledTimes(3);
  });

  test.each([401, 403, 400])('records terminal HTTP %s without automatic retry', async (status) => {
    const f = fixture();
    f.post.mockRejectedValue({ response: { status } });
    await f.dispatch(10);
    expect(f.state).toMatchObject({ status: 'failed', nextAttemptAt: null, errorCode: `X_HTTP_${status}` });
    await f.dispatch(10);
    expect(f.post).toHaveBeenCalledTimes(1);
  });

  test.each([undefined, 408, 500, 503])('treats ambiguous response %s as uncertain and never blindly retries', async (status) => {
    const f = fixture();
    f.post.mockRejectedValue({ response: status ? { status } : undefined });
    await f.dispatch(10);
    expect(f.state.status).toBe('uncertain');
    await f.dispatch(10);
    expect(f.post).toHaveBeenCalledTimes(1);
  });

  test('invalid API success response requires reconciliation', async () => {
    const f = fixture();
    f.post.mockResolvedValue({ data: { data: {} } });
    await f.dispatch(10);
    expect(f.state).toMatchObject({ status: 'uncertain', errorCode: 'X_INVALID_RESPONSE' });
  });

  test('a crash-equivalent persistence failure leaves sending, not a retryable state', async () => {
    const f = fixture();
    f.repository.finish.mockRejectedValue(new Error('database unavailable'));
    expect(await f.dispatch(10)).toMatchObject({ status: 'error' });
    expect(f.state.status).toBe('sending');
    await f.dispatch(10);
    expect(f.post).toHaveBeenCalledTimes(1);
  });

  test('content errors are terminal and require correction before recovery', async () => {
    const f = fixture({ winners: [makeWinner(1, '0')] });
    await f.dispatch(10);
    expect(f.state).toMatchObject({ status: 'failed', nextAttemptAt: null, errorCode: 'X_CONTENT_INVALID' });
    await f.dispatch(10);
    expect(f.repository.reject).toHaveBeenCalledTimes(1);
    expect(f.post).not.toHaveBeenCalled();
  });

  test('errors are sanitized and never expose Axios credentials or response bodies', async () => {
    const f = fixture();
    f.post.mockRejectedValue({
      message: 'SECRET', config: { headers: { Authorization: 'SECRET' } },
      response: { status: 401, data: 'SECRET' },
    });
    await f.dispatch(10);
    expect(JSON.stringify(f.logger.error.mock.calls)).not.toContain('SECRET');
  });

  test('image-render failure is terminal, explicit, and does not fall back to text-only publication', async () => {
    const f = fixture();
    f.renderImage.mockRejectedValue(new Error('renderer unavailable'));
    await f.dispatch(10);
    expect(f.state).toMatchObject({ status: 'failed', errorCode: 'X_IMAGE_RENDER_FAILED', nextAttemptAt: null });
    expect(f.upload).not.toHaveBeenCalled();
    expect(f.post).not.toHaveBeenCalled();
  });

  test('ambiguous upload failures are retryable because no post was submitted', async () => {
    const f = fixture();
    f.upload.mockRejectedValue(new Error('upload timeout SECRET'));
    await f.dispatch(10);
    expect(f.state.status).toBe('failed');
    expect(f.state.nextAttemptAt).toEqual(new Date(date.getTime() + 60_000));
    expect(f.post).not.toHaveBeenCalled();
    expect(JSON.stringify(f.logger.error.mock.calls)).not.toContain('SECRET');
    f.state.nextAttemptAt = date;
    f.upload.mockResolvedValue('77777');
    await f.dispatch(10);
    expect(f.state.status).toBe('published');
    expect(f.post).toHaveBeenCalledTimes(1);
    expect(f.post).toHaveBeenCalledWith(expect.any(String), credentials, '77777');
  });

  test('media access rejection is terminal and never submits a text-only post', async () => {
    const f = fixture();
    f.upload.mockRejectedValue({ response: { status: 403 } });
    await f.dispatch(10);
    expect(f.state).toMatchObject({ status: 'failed', errorCode: 'X_MEDIA_HTTP_403', nextAttemptAt: null });
    expect(f.post).not.toHaveBeenCalled();
  });

  test('invalid media IDs cannot reach the create-post endpoint', async () => {
    const f = fixture();
    f.upload.mockResolvedValue(undefined);
    await f.dispatch(10);
    expect(f.state.status).toBe('failed');
    expect(f.state.nextAttemptAt).not.toBeNull();
    expect(f.post).not.toHaveBeenCalled();
  });

  test('upload rate limits honor Retry-After and share the three-attempt publication budget', async () => {
    const f = fixture({ record: { attempts: 1 } });
    f.upload.mockRejectedValue({ response: { status: 429, headers: { 'retry-after': '300' } } });
    await f.dispatch(10);
    expect(f.state).toMatchObject({ status: 'failed', errorCode: 'X_MEDIA_HTTP_429', attempts: 2 });
    expect(f.state.nextAttemptAt).toEqual(new Date(date.getTime() + 300_000));
    f.state.nextAttemptAt = date;
    await f.dispatch(10);
    expect(f.state).toMatchObject({ attempts: 3, nextAttemptAt: null });
    expect(f.post).not.toHaveBeenCalled();
  });
});

test('rate-limit reset and HTTP-date Retry-After are respected', () => {
  const until = new Date(date.getTime() + 180_000);
  expect(classifyFailure({ response: { status: 429, headers: { 'retry-after': until.toUTCString() } } }, date).delay).toBe(180_000);
  expect(classifyFailure({ response: { status: 429, headers: { 'x-rate-limit-reset': until.getTime() / 1000 } } }, date).delay).toBe(180_000);
});
