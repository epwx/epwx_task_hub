import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const calls = [];
let record;
let lastQuery;
const Op = { lt: Symbol('lt'), lte: Symbol('lte'), or: Symbol('or'), in: Symbol('in') };
const draw = { id: 10, drawDate: '2026-10-19', status: 'completed' };
const winners = [{ wallet: `0x${'a'.repeat(40)}`, rank: 1, prizeAmount: '100000', status: 'pending' }];
let httpResponse = { data: { data: { id: '1234' } } };
let winnerQuery;
let staleCount = 0;
const announcementModel = {
  sequelize: { close: async () => {} },
  async findOrCreate() {
    record ||= { id: 1, drawId: 10, status: 'pending', attempts: 0, nextAttemptAt: null };
    return [{ get: () => ({ ...record }) }];
  },
  async update(values, { where }) {
    if (where.updatedAt) {
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
    lastQuery = query;
    return record ? [record] : [];
  },
};

mock.module('axios', {
  defaultExport: {
    async post(...args) {
      calls.push(args);
      if (httpResponse instanceof Error) throw httpResponse;
      return httpResponse;
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

const { announceDailyDraw, retryDailyDrawAnnouncements, announcementRepository } =
  await import('../src/services/dailyDrawAnnouncements.js');

function reset() {
  calls.length = 0;
  record = null;
  staleCount = 0;
  Object.assign(process.env, {
    DAILY_DRAW_X_ENABLED: 'true',
    DAILY_DRAW_X_API_KEY: 'dummy-key',
    DAILY_DRAW_X_API_SECRET: 'dummy-secret',
    DAILY_DRAW_X_ACCESS_TOKEN: 'dummy-token',
    DAILY_DRAW_X_ACCESS_TOKEN_SECRET: 'dummy-token-secret',
    FRONTEND_URL: 'https://example.com',
  });
  httpResponse = { data: { data: { id: '1234' } } };
}

test('real service signs the X request, uses a timeout, and stores a confirmed post without changing winners', async () => {
  reset();
  const before = JSON.stringify(winners);
  assert.equal((await announceDailyDraw(10)).status, 'published');
  assert.equal(record.status, 'published');
  assert.equal(record.postId, '1234');
  assert.equal(record.attempts, 1);
  const [url, body, options] = calls[0];
  assert.equal(url, 'https://api.x.com/2/tweets');
  assert.ok(body.text.includes('Selected winners:'));
  assert.ok(options.headers.Authorization.startsWith('OAuth '));
  assert.equal(options.timeout, 15000);
  assert.equal(options.maxRedirects, 0);
  assert.deepEqual(winnerQuery, { where: { drawId: 10 }, order: [['rank', 'ASC']] });
  assert.equal(JSON.stringify(winners), before);
  await announceDailyDraw(10);
  assert.equal(calls.length, 1);
});

test('real storage adapter compare-and-set prevents competing dispatchers', async () => {
  reset();
  await Promise.all([announceDailyDraw(10), announceDailyDraw(10)]);
  assert.equal(calls.length, 1);
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
  assert.equal(calls.length, 1);
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
