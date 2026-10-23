import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const calls = [];
let record;
let lastQuery;
const Op = { lt: Symbol('lt'), lte: Symbol('lte'), or: Symbol('or'), in: Symbol('in') };
const draw = { id: 10, drawDate: '2026-10-19', status: 'completed' };
const winners = [{ wallet: `0x${'a'.repeat(40)}`, rank: 1, prizeAmount: '100000', status: 'pending' }];
let httpResponse = { data: { data: { id: '1234' } } };
let mediaResponse;
let telegramResponse;
const telegramCalls = () => calls.filter(([url]) => url.includes('api.telegram.org/'));
const postCalls = () => calls.filter(([url]) => url.endsWith('/2/tweets'));
const mediaCalls = () => calls.filter(([url]) => url.endsWith('/2/media/upload'));
let winnerQuery;
let staleCount = 0;
const announcementModel = {
  sequelize: { close: async () => {} },
  async findOrCreate() {
    record ||= {
      id: 1, drawId: 10, status: 'pending', attempts: 0, nextAttemptAt: null,
      telegramStatus: null, deleteStatus: null, draw,
    };
    return [{ get: () => ({ ...record }) }];
  },
  async findOne({ where }) {
    return record && Object.entries(where).every(([key, value]) => record[key] === value) ? record : null;
  },
  async update(values, { where }) {
    if (where.updatedAt) {
      if (where.telegramStatus) {
        if (!record || record.telegramStatus !== 'sending' || !staleCount) return [0];
        Object.assign(record, values);
        return [staleCount];
      }
      if (!record || record.status !== 'sending' || !staleCount) return [0];
      Object.assign(record, values);
      return [staleCount];
    }
    if (!record || Object.entries(where).some(([key, value]) =>
      value?.[Op.in] ? !value[Op.in].includes(record[key]) : record[key] !== value)) return [0];
    Object.assign(record, values);
    return [1];
  },
  async findAll(query) {
    if (!Object.hasOwn(query.where, 'telegramStatus')) lastQuery = query;
    return record ? [record] : [];
  },
};

mock.module('axios', {
  defaultExport: {
    async post(...args) {
      calls.push(args);
      const response = args[0].includes('api.telegram.org/') ? telegramResponse
        : args[0].endsWith('/2/media/upload') ? mediaResponse : httpResponse;
      if (response instanceof Error) throw response;
      return response;
    },
  },
});
mock.module('sequelize', { namedExports: { Op } });
mock.module('dotenv/config', { defaultExport: {} });
mock.module('../src/models/index.js', {
  namedExports: {
    DailyDraw: { findByPk: async () => draw },
    DailyDrawWinner: { findAll: async (query) => { winnerQuery = query; return winners; } },
    DailyDrawAnnouncement: announcementModel,
  },
});

const { announceDailyDraw, retryDailyDrawAnnouncements, announcementRepository, relayDailyDrawToTelegram } =
  await import('../src/services/dailyDrawAnnouncements.js');

function reset() {
  calls.length = 0;
  record = null;
  staleCount = 0;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_GROUP_ID;
  process.env.DAILY_DRAW_X_DELETE_PREVIOUS = 'false';
  Object.assign(process.env, {
    DAILY_DRAW_X_ENABLED: 'true',
    DAILY_DRAW_X_API_KEY: 'dummy-key',
    DAILY_DRAW_X_API_SECRET: 'dummy-secret',
    DAILY_DRAW_X_ACCESS_TOKEN: 'dummy-token',
    DAILY_DRAW_X_ACCESS_TOKEN_SECRET: 'dummy-token-secret',
    FRONTEND_URL: 'https://example.com',
  });
  httpResponse = { data: { data: { id: '1234' } } };
  mediaResponse = { data: { data: { id: '5678' } } };
  telegramResponse = { data: { ok: true, result: { message_id: 42 } } };
}

function enableTelegram() {
  process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
  process.env.TELEGRAM_GROUP_ID = '-100123456';
}

test('confirmed X publication shares its link to the daily-claim Telegram group once', async () => {
  reset();
  enableTelegram();
  assert.equal((await announceDailyDraw(10)).status, 'published');
  assert.equal(record.telegramStatus, 'sent');
  assert.ok(record.telegramNotifiedAt instanceof Date);
  const [url, body, options] = telegramCalls()[0];
  assert.equal(url, 'https://api.telegram.org/bottest-bot-token/sendMessage');
  assert.equal(body.chat_id, '-100123456');
  assert.equal(body.parse_mode, 'HTML');
  assert.ok(body.text.includes('2026-10-19'));
  assert.ok(body.text.includes('https://x.com/i/status/1234'));
  assert.equal(options.timeout, 10000);
  assert.ok(calls.indexOf(telegramCalls()[0]) > calls.indexOf(postCalls()[0]));
  await announceDailyDraw(10);
  await Promise.all([relayDailyDrawToTelegram(10), relayDailyDrawToTelegram(10)]);
  assert.equal(telegramCalls().length, 1);
  assert.equal(postCalls().length, 1);
});

test('competing Telegram relays claim one delivery and recover unsent published links after restart', async () => {
  reset();
  enableTelegram();
  record = {
    id: 1, drawId: 10, status: 'published', postId: '9876', attempts: 1,
    telegramStatus: null, deleteStatus: null, draw,
  };
  await Promise.all([relayDailyDrawToTelegram(10), relayDailyDrawToTelegram(10)]);
  assert.equal(telegramCalls().length, 1);
  assert.equal(postCalls().length, 0);
  assert.equal(record.telegramStatus, 'sent');
});

test('Telegram failure cannot change published X state, leak a bot token, or trigger duplicate sends', async () => {
  reset();
  enableTelegram();
  telegramResponse = new Error('https://api.telegram.org/botSECRET/sendMessage timed out');
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args.join(' '));
  try {
    assert.equal((await announceDailyDraw(10)).status, 'published');
    assert.equal(record.status, 'published');
    assert.equal(record.telegramStatus, 'failed');
    assert.equal(record.telegramErrorCode, 'telegram_send_failed');
    await retryDailyDrawAnnouncements();
    assert.equal(telegramCalls().length, 1);
    assert.equal(postCalls().length, 1);
    assert.ok(logs.length);
    assert.ok(!logs.join('\n').includes('SECRET'));
  } finally {
    console.error = original;
  }
});

test('Telegram missing configuration leaves the link pending; sweep sends it when configured', async () => {
  reset();
  await announceDailyDraw(10);
  assert.equal(telegramCalls().length, 0);
  assert.equal(record.telegramStatus, null);
  enableTelegram();
  await retryDailyDrawAnnouncements();
  assert.equal(telegramCalls().length, 1);
  assert.equal(record.telegramStatus, 'sent');
});

test('uncertain X outcomes and historical, deleted or already claimed links never send to Telegram', async () => {
  reset();
  enableTelegram();
  httpResponse = new Error('timeout');
  await announceDailyDraw(10);
  assert.equal(telegramCalls().length, 0);
  for (const state of ['skipped', 'sending', 'uncertain', 'failed', 'sent']) {
    record = {
      id: 1, drawId: 10, status: 'published', postId: '1234',
      telegramStatus: state, deleteStatus: null, draw,
    };
    await relayDailyDrawToTelegram(10);
  }
  record.telegramStatus = null;
  record.deleteStatus = 'deleted';
  await relayDailyDrawToTelegram(10);
  assert.equal(telegramCalls().length, 0);
});

test('unconfirmed Telegram response is not recorded as delivered', async () => {
  reset();
  enableTelegram();
  telegramResponse = { data: { ok: false } };
  await announceDailyDraw(10);
  assert.equal(record.telegramStatus, 'failed');
  assert.equal(record.telegramErrorCode, 'telegram_send_unconfirmed');
});

test('interrupted Telegram sends become uncertain rather than sending twice', async () => {
  reset();
  enableTelegram();
  record = {
    id: 1, drawId: 10, status: 'published', postId: '1234',
    telegramStatus: 'sending', deleteStatus: null, draw,
  };
  staleCount = 1;
  await retryDailyDrawAnnouncements();
  assert.equal(record.telegramStatus, 'uncertain');
  assert.equal(record.telegramErrorCode, 'TELEGRAM_INTERRUPTED_SEND');
  assert.equal(telegramCalls().length, 0);
});

test('daily-claim notifications still use the same group and HTML formatting', async () => {
  reset();
  enableTelegram();
  const { notifyDailyClaimPaid, buildDailyDrawPublishedMessage } =
    await import('../src/services/telegramNotifications.js');
  assert.throws(() => buildDailyDrawPublishedMessage({ drawDate: '2026-10-19', postId: '123"><script>' }));
  const result = await notifyDailyClaimPaid({
    wallet: `0x${'a'.repeat(40)}`, amount: '1000', claimedAt: '2026-10-19T12:00:00Z',
    badgeLabel: '<Buyer>',
  });
  assert.equal(result.sent, true);
  const [, body] = telegramCalls()[0];
  assert.equal(body.chat_id, '-100123456');
  assert.ok(body.text.includes('EPWX Daily Reward Sent'));
  assert.ok(body.text.includes('1,000 EPWX'));
  assert.ok(body.text.includes('&lt;Buyer&gt;'));
  assert.ok(body.text.includes('Claim Daily Free EPWX'));
});

test('real service signs the X request, uses a timeout, and stores a confirmed post without changing winners', async () => {
  reset();
  const before = JSON.stringify(winners);
  assert.equal((await announceDailyDraw(10)).status, 'published');
  assert.equal(record.status, 'published');
  assert.equal(record.postId, '1234');
  assert.equal(record.attempts, 1);
  const [mediaUrl, mediaBody, mediaOptions] = mediaCalls()[0];
  assert.equal(mediaUrl, 'https://api.x.com/2/media/upload');
  assert.equal(mediaBody.media_category, 'tweet_image');
  assert.equal(Buffer.from(mediaBody.media, 'base64').subarray(1, 4).toString(), 'PNG');
  assert.ok(mediaOptions.headers.Authorization.startsWith('OAuth '));
  const [url, body, options] = postCalls()[0];
  assert.equal(url, 'https://api.x.com/2/tweets');
  assert.ok(body.text.includes('Congratulations'));
  assert.deepEqual(body.media, { media_ids: ['5678'] });
  assert.ok(options.headers.Authorization.startsWith('OAuth '));
  assert.equal(options.timeout, 15000);
  assert.equal(options.maxRedirects, 0);
  assert.deepEqual(winnerQuery, { where: { drawId: 10 }, order: [['rank', 'ASC']] });
  assert.equal(JSON.stringify(winners), before);
  await announceDailyDraw(10);
  assert.equal(postCalls().length, 1);
  assert.equal(mediaCalls().length, 1);
});

test('real storage adapter compare-and-set prevents competing dispatchers', async () => {
  reset();
  await Promise.all([announceDailyDraw(10), announceDailyDraw(10)]);
  assert.equal(postCalls().length, 1);
  assert.equal(mediaCalls().length, 1);
  assert.equal(record.status, 'published');
  await assert.rejects(announcementRepository.finish(record.id, { status: 'failed' }));
});

test('missing credentials leave a recoverable configuration error and make no HTTP request', async () => {
  reset();
  delete process.env.DAILY_DRAW_X_API_KEY;
  assert.equal((await announceDailyDraw(10)).status, 'configuration-error');
  assert.equal(record.errorCode, 'DAILY_DRAW_X_CREDENTIALS_MISSING');
  assert.equal(record.status, 'failed');
  assert.equal(calls.length, 0);
});

test('disabled service and retry sweep do not load storage or make HTTP requests', async () => {
  reset();
  process.env.DAILY_DRAW_X_ENABLED = 'false';
  assert.equal((await announceDailyDraw(10)).status, 'disabled');
  await retryDailyDrawAnnouncements();
  assert.equal(record, null);
  assert.equal(calls.length, 0);
});

test('retry sweep processes stored failed draws from earlier dates, independent of the daily target', async () => {
  reset();
  record = { id: 1, drawId: 10, status: 'failed', attempts: 1, nextAttemptAt: new Date(0) };
  await retryDailyDrawAnnouncements();
  assert.equal(record.status, 'published');
  assert.equal(record.attempts, 2);
  assert.equal(postCalls().length, 1);
  assert.equal(lastQuery.limit, 20);
  assert.equal(lastQuery.where.attempts[Op.lt], 3);
});

test('interrupted sends become uncertain without a duplicate X request', async () => {
  reset();
  record = { id: 1, drawId: 10, status: 'sending', attempts: 1, nextAttemptAt: null };
  staleCount = 1;
  await retryDailyDrawAnnouncements();
  assert.equal(record.status, 'uncertain');
  assert.equal(record.errorCode, 'X_INTERRUPTED_DISPATCH');
  assert.equal(calls.length, 0);
});

test('media access failures stop before posting and retain a terminal error', async () => {
  reset();
  mediaResponse = Object.assign(new Error('do not print credential-bearing Axios error'), {
    response: { status: 403 },
  });
  assert.equal((await announceDailyDraw(10)).status, 'failed');
  assert.equal(record.status, 'failed');
  assert.equal(record.nextAttemptAt, null);
  assert.equal(mediaCalls().length, 1);
  assert.equal(postCalls().length, 0);
});

test('asynchronous or malformed media responses never publish a broken attachment', async () => {
  for (const data of [
    { id: '5678', processing_info: { state: 'pending' } },
    { id: '5678', processing_info: { state: 'failed' } },
    {},
  ]) {
    reset();
    mediaResponse = { data: { data } };
    assert.equal((await announceDailyDraw(10)).status, 'failed');
    assert.equal(record.status, 'failed');
    assert.ok(record.nextAttemptAt);
    assert.equal(postCalls().length, 0);
  }
});

test('uncertain final post outcomes remain uncertain after successful media upload', async () => {
  reset();
  httpResponse = new Error('post timeout');
  assert.equal((await announceDailyDraw(10)).status, 'uncertain');
  assert.equal(record.status, 'uncertain');
  await announceDailyDraw(10);
  assert.equal(mediaCalls().length, 1);
  assert.equal(postCalls().length, 1);
});

test('database failure is reported without invalidating completed winners or leaking errors', async () => {
  reset();
  const find = announcementModel.findOrCreate;
  announcementModel.findOrCreate = async () => { throw new Error('SECRET DB details'); };
  try {
    assert.equal((await announceDailyDraw(10)).status, 'error');
    assert.equal(draw.status, 'completed');
    assert.equal(winners[0].status, 'pending');
    assert.equal(calls.length, 0);
  } finally {
    announcementModel.findOrCreate = find;
  }
});

async function runRecovery(args, name) {
  const previousArgv = process.argv;
  const previousExitCode = process.exitCode;
  process.argv = ['node', 'dailyDrawAnnouncements.js', ...args];
  process.exitCode = 0;
  try {
    await import(`../scripts/dailyDrawAnnouncements.js?case=${name}`);
    return process.exitCode;
  } finally {
    process.argv = previousArgv;
    process.exitCode = previousExitCode;
  }
}

test('operator recovery records verified post IDs and never calls X', async () => {
  reset();
  process.env.DAILY_DRAW_X_ENABLED = 'false';
  record = { id: 1, drawId: 10, status: 'uncertain', attempts: 1 };
  assert.equal(await runRecovery(['published', '10', '12345'], 'published'), 0);
  assert.equal(record.status, 'published');
  assert.equal(record.postId, '12345');
  assert.equal(calls.length, 0);
});

test('operator reset requires confirmation and disabled publishing and cannot overwrite published records', async () => {
  reset();
  record = { id: 1, drawId: 10, status: 'failed', attempts: 3 };
  assert.equal(await runRecovery(['retry', '10', '--confirmed-no-post'], 'enabled'), 1);
  assert.equal(record.attempts, 3);
  process.env.DAILY_DRAW_X_ENABLED = 'false';
  assert.equal(await runRecovery(['retry', '10'], 'missing-confirmation'), 1);
  assert.equal(record.attempts, 3);
  assert.equal(await runRecovery(['retry', '10', '--confirmed-no-post'], 'retry'), 0);
  assert.equal(record.status, 'pending');
  assert.equal(record.attempts, 0);
  record.status = 'published';
  assert.equal(await runRecovery(['retry', '10', '--confirmed-no-post'], 'already-published'), 1);
  assert.equal(record.status, 'published');
  assert.equal(calls.length, 0);
});

test('migration creates a transactional table with unique per-draw publication state', async () => {
  const { default: migration } = await import('../migrations/20261020000000-create-daily-draw-announcements.js');
  let schema;
  const events = [];
  const tx = {};
  const queryInterface = {
    sequelize: { transaction: async (fn) => { events.push('transaction'); await fn(tx); } },
    async createTable(name, columns, options) {
      assert.equal(name, 'daily_draw_announcements');
      assert.equal(options.transaction, tx);
      schema = columns;
      events.push('table');
    },
    async addIndex(name, columns, options) {
      assert.deepEqual(columns, ['status', 'nextAttemptAt']);
      assert.equal(options.transaction, tx);
      events.push('index');
    },
    async dropTable(name) { assert.equal(name, 'daily_draw_announcements'); events.push('drop'); },
  };
  const types = { INTEGER: 'INTEGER', STRING: 'STRING', DATE: 'DATE', fn: () => 'NOW()' };
  await migration.up(queryInterface, types);
  assert.deepEqual(events, ['transaction', 'table', 'index']);
  assert.equal(schema.drawId.unique, true);
  assert.equal(schema.drawId.references.model, 'daily_draws');
  assert.equal(schema.status.defaultValue, 'pending');
  assert.equal(schema.attempts.defaultValue, 0);
  await migration.down(queryInterface);
  assert.equal(events.at(-1), 'drop');
});

test('Telegram migration tracks delivery separately and skips pre-existing published announcements', async () => {
  const { default: migration } = await import('../migrations/20261023000000-add-daily-draw-telegram-notification.js');
  const transaction = {};
  const added = [];
  const removed = [];
  let skipped;
  const queryInterface = {
    sequelize: { transaction: async (callback) => callback(transaction) },
    async addColumn(table, column, options, context) {
      assert.equal(table, 'daily_draw_announcements');
      assert.equal(context.transaction, transaction);
      assert.equal(options.allowNull, true);
      added.push(column);
    },
    async bulkUpdate(table, values, where, options) {
      assert.equal(table, 'daily_draw_announcements');
      assert.equal(options.transaction, transaction);
      skipped = { values, where };
    },
    async removeColumn(table, column, options) {
      assert.equal(table, 'daily_draw_announcements');
      assert.equal(options.transaction, transaction);
      removed.push(column);
    },
  };
  await migration.up(queryInterface, { STRING: 'STRING', DATE: 'DATE' });
  assert.deepEqual(added, ['telegramStatus', 'telegramNotifiedAt', 'telegramErrorCode']);
  assert.deepEqual(skipped, { values: { telegramStatus: 'skipped' }, where: { status: 'published' } });
  await migration.down(queryInterface);
  assert.deepEqual(removed, [...added].reverse());
});
