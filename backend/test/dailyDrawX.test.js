const crypto = require('crypto');
const {
  POST_URL, readConfig, authorizationHeader, renderAnnouncement, classifyFailure, createDispatcher,
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
  const post = jest.fn(async () => ({ data: { data: { id: '123456789' } } }));
  const logger = { error: jest.fn(), log: jest.fn() };
  const dispatch = createDispatcher({
    repository, post, logger, now: () => date, config: options.config || config,
  });
  return { dispatch, state, repository, post, logger };
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
});

describe('daily draw X announcement content', () => {
  test('renders five winners within 280 characters without usernames, full wallets, or payment claims', () => {
    const winners = Array.from({ length: 5 }, (_, index) => makeWinner(index + 1));
    const text = renderAnnouncement(draw, winners, config.frontendUrl);
    expect(text.length).toBeLessThanOrEqual(280);
    expect(text).toContain('2026-10-19');
    expect(text).toContain('0x0000...0001: 100,000 EPWX');
    expect(text).not.toMatch(/@|shouldNeverBeMentioned|paid|sent|transferred/i);
    for (const winner of winners) expect(text).not.toContain(winner.wallet);
    const paidText = renderAnnouncement(draw, winners.map((winner) => ({ ...winner, status: 'paid' })), config.frontendUrl);
    expect(paidText).toBe(text);
  });

  test('orders winners by rank without mutating input and preserves integer precision', () => {
    const winners = [makeWinner(2, '999999999999999999999'), makeWinner(1)];
    const text = renderAnnouncement(draw, winners, config.frontendUrl);
    expect(text.indexOf('...0001')).toBeLessThan(text.indexOf('...0002'));
    expect(text).toContain('999,999,999,999,999,999,999');
    expect(winners[0].rank).toBe(2);
  });

  test('oversized draws use a bounded summary, exact total, and results board link', () => {
    const winners = Array.from({ length: 50 }, (_, index) => makeWinner(index + 1));
    const text = renderAnnouncement(draw, winners, 'https://tasks.example.com/somewhere?x=1');
    expect(text).toContain('50 winners selected.');
    expect(text).toContain('5,000,000 EPWX');
    expect(text).toContain('https://tasks.example.com/#latest-winners');
    expect(text.replace(/https?:\/\/\S+/g, 'x'.repeat(23)).length).toBeLessThanOrEqual(280);
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
    expect(f.post).toHaveBeenCalledWith(expect.stringContaining('Selected winners:'), credentials);
    expect(f.state).toMatchObject({ status: 'published', attempts: 1, postId: '123456789', publishedAt: date });
    await f.dispatch(10);
    expect(f.post).toHaveBeenCalledTimes(1);
  });

  test('concurrent dispatchers claim only one post', async () => {
    const f = fixture();
    await Promise.all([f.dispatch(10), f.dispatch(10), f.dispatch(10)]);
    expect(f.post).toHaveBeenCalledTimes(1);
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
});

test('rate-limit reset and HTTP-date Retry-After are respected', () => {
  const until = new Date(date.getTime() + 180_000);
  expect(classifyFailure({ response: { status: 429, headers: { 'retry-after': until.toUTCString() } } }, date).delay).toBe(180_000);
  expect(classifyFailure({ response: { status: 429, headers: { 'x-rate-limit-reset': until.getTime() / 1000 } } }, date).delay).toBe(180_000);
});
