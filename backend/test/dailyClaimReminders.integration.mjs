import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const messages = [];
let preferences = [];
let deliveryError = null;
const claim = { id: 42, claimedAt: '2026-10-24T12:00:00.000Z', streakDay: 4 };
const now = new Date('2026-10-25T12:00:00.000Z');
function preference(overrides = {}) {
  return {
    wallet: '0x1111111111111111111111111111111111111111',
    email: 'claimer@example.test',
    emailVerifiedAt: '2026-10-23T12:00:00.000Z',
    remindersEnabled: true,
    unsubscribedAt: null,
    lastReminderClaimId: null,
    async save() {},
    ...overrides,
  };
}

mock.module('nodemailer', {
  defaultExport: {
    createTransport() {
      return {
        async sendMail(message) {
          if (deliveryError) throw deliveryError;
          messages.push(message);
        },
      };
    },
  },
});
mock.module('../src/models/DailyClaimEmailPreference.js', {
  defaultExport: {
    async findAll({ where }) {
      assert.equal(where.remindersEnabled, true);
      assert.equal(where.unsubscribedAt, null);
      return preferences.filter(item => item.remindersEnabled && !item.unsubscribedAt);
    },
  },
});
mock.module('../src/models/DailyClaim.js', {
  defaultExport: { async findOne() { return claim; } },
});
mock.module('../src/models/Merchant.js', { defaultExport: {} });
process.env.SMTP_HOST = 'smtp.example.test';
process.env.SMTP_USER = 'sender@example.test';
process.env.SMTP_PASS = 'test-only-password';
process.env.FRONTEND_URL = 'https://tasks.example.test';
process.env.PUBLIC_API_URL = 'https://api.example.test/api';
const { sendReadyDailyClaimReminders } = await import('../src/services/emailNotifications.js');

test('personalized reminders preserve dispatch behavior', async t => {
  await t.test('renders next benefit in plain text and HTML, with claim and unsubscribe links', async () => {
    preferences = [preference()];
    assert.deepEqual(await sendReadyDailyClaimReminders(now), { checked: 1, sent: 1, failed: 0 });
    const message = messages[0];
    assert.equal(message.subject, 'Your EPWX claim is ready: Day 5, 3 draw entries');
    for (const body of [message.text, message.html]) {
      assert.match(body, /Day 5 with 3 draw entries/);
      assert.match(body, /Mon, 26 Oct 2026 12:00:00 GMT/);
      assert.match(body, /https:\/\/tasks.example.test\/#daily-claim/);
      assert.match(body, /Entries do not guarantee a win/);
      assert.match(body, /https:\/\/tasks.example.test\/email\/unsubscribe\?token=/);
    }
    assert.match(message.headers['List-Unsubscribe'], /https:\/\/api.example.test\/api\/epwx\/daily-claim\/email\/unsubscribe\?token=/);
    assert.equal(message.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
    assert.equal(preferences[0].lastReminderClaimId, claim.id);
    assert.deepEqual(await sendReadyDailyClaimReminders(now), { checked: 1, sent: 0, failed: 0 });
    assert.equal(messages.length, 1);
  });

  await t.test('does not notify disabled, unsubscribed, or unverified preferences', async () => {
    preferences = [
      preference({ remindersEnabled: false }),
      preference({ unsubscribedAt: now }),
      preference({ emailVerifiedAt: null }),
    ];
    assert.deepEqual(await sendReadyDailyClaimReminders(now), { checked: 1, sent: 0, failed: 0 });
    assert.equal(messages.length, 1);
  });

  await t.test('does not mark failed delivery sent and retries the personalized email', async () => {
    preferences = [preference()];
    deliveryError = new Error('Test SMTP failure');
    assert.deepEqual(await sendReadyDailyClaimReminders(now), { checked: 1, sent: 0, failed: 1 });
    assert.equal(preferences[0].lastReminderClaimId, null);
    deliveryError = null;
    assert.deepEqual(await sendReadyDailyClaimReminders(now), { checked: 1, sent: 1, failed: 0 });
    assert.equal(messages.length, 2);
  });

  await t.test('delayed dispatch does not promise an expired streak', async () => {
    preferences = [preference()];
    assert.deepEqual(await sendReadyDailyClaimReminders(new Date('2026-10-26T12:00:00.001Z')), { checked: 1, sent: 1, failed: 0 });
    assert.equal(messages.at(-1).subject, 'Your EPWX claim is ready: Day 1, 1 draw entry');
    assert.match(messages.at(-1).text, /Start a fresh seven-day streak/);
  });
});
