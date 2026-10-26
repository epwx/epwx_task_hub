import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import {
  DAILY_CLAIM_COOLDOWN_MS,
  DAILY_CLAIM_STREAK_WINDOW_MS,
  DAILY_CLAIM_ENTRY_SCHEDULE,
  getDailyClaimProgress,
  getDailyClaimReturnMessage,
  parseLatestDailyClaim,
} from "../src/utils/dailyClaimProgress.ts";

const require = createRequire(import.meta.url);
const {
  STREAK_ENTRY_SCHEDULE,
  STREAK_GRACE_PERIOD_MS,
  calculateDailyClaimStreak,
} = require("../../backend/src/utils/dailyClaimStreak.cjs");
const claimedAt = Date.parse("2026-10-24T12:00:00.000Z");
const claim = { claimedAt, streakDay: 4, drawEntries: 2 };

test("post-claim message uses the recorded claim's next eligible local time and benefit", () => {
  const message = getDailyClaimReturnMessage(claim, claimedAt);
  assert.equal(message, `Day 4 complete. Return at ${new Date(claimedAt + DAILY_CLAIM_COOLDOWN_MS).toLocaleString()} (your local time) to reach Day 5 with 3 draw entries.`);
});

test("post-claim message explains cycle rollover and singular entries", () => {
  const message = getDailyClaimReturnMessage({ ...claim, streakDay: 7 }, claimedAt);
  assert.match(message, /Day 7 complete/);
  assert.match(message, /start a new cycle at Day 1 with 1 draw entry\./);
});

test("post-claim return invitation disappears once the return time is reached", () => {
  assert.equal(getDailyClaimReturnMessage(claim, claimedAt + DAILY_CLAIM_COOLDOWN_MS), null);
  assert.equal(getDailyClaimReturnMessage(claim, claimedAt + DAILY_CLAIM_STREAK_WINDOW_MS + 1), null);
});

test("frontend policy matches the existing backend streak policy", () => {
  assert.deepEqual(DAILY_CLAIM_ENTRY_SCHEDULE, STREAK_ENTRY_SCHEDULE);
  assert.equal(DAILY_CLAIM_STREAK_WINDOW_MS, STREAK_GRACE_PERIOD_MS);
  assert.equal(DAILY_CLAIM_COOLDOWN_MS, 86_400_000);
});

test("only a valid empty history starts a new wallet at day one", () => {
  assert.equal(parseLatestDailyClaim({ claims: [] }), null);
  const progress = getDailyClaimProgress(null, claimedAt);
  assert.equal(progress.completedDays, 0);
  assert.equal(progress.nextDay, 1);
  assert.equal(progress.nextDrawEntries, 1);
  assert.equal(progress.readyAt, null);
  assert.equal(progress.streakDeadline, null);
  assert.equal(progress.remainingCooldownMs, 0);
  assert.equal(progress.expired, false);
});

test("parses the latest stored claim and numeric database strings", () => {
  assert.deepEqual(parseLatestDailyClaim({
    claims: [
      { claimedAt: new Date(claimedAt).toISOString(), streakDay: "4", drawEntries: "2" },
      { claimedAt: "invalid older claim" },
    ],
  }), claim);
});

test("legacy history without streak fields retains day-one defaults", () => {
  assert.deepEqual(parseLatestDailyClaim({
    claims: [{ claimedAt: new Date(claimedAt).toISOString() }],
  }), { claimedAt, streakDay: 1, drawEntries: 1 });
});

for (const [name, payload] of [
  ["missing response", null],
  ["missing claims", {}],
  ["API error", { error: "unavailable" }],
  ["non-array claims", { claims: {} }],
  ["null latest claim", { claims: [null] }],
  ["missing time", { claims: [{ streakDay: 1 }] }],
  ["invalid time", { claims: [{ claimedAt: "invalid" }] }],
  ["numeric time", { claims: [{ claimedAt }] }],
  ["invalid day", { claims: [{ claimedAt: new Date(claimedAt).toISOString(), streakDay: 8 }] }],
  ["fractional day", { claims: [{ claimedAt: new Date(claimedAt).toISOString(), streakDay: 1.5 }] }],
  ["boolean day", { claims: [{ claimedAt: new Date(claimedAt).toISOString(), streakDay: true }] }],
  ["zero entries", { claims: [{ claimedAt: new Date(claimedAt).toISOString(), drawEntries: 0 }] }],
  ["excess entries", { claims: [{ claimedAt: new Date(claimedAt).toISOString(), drawEntries: 6 }] }],
]) {
  test(`rejects ${name} instead of presenting claim-ready state`, () => {
    assert.throws(() => parseLatestDailyClaim(payload), /Daily claim history/);
  });
}

test("shows current progress and the next claim's benefit during cooldown", () => {
  const progress = getDailyClaimProgress(claim, claimedAt + 60_000);
  assert.equal(progress.completedDays, 4);
  assert.equal(progress.nextDay, 5);
  assert.equal(progress.nextDrawEntries, 3);
  assert.equal(progress.remainingCooldownMs, DAILY_CLAIM_COOLDOWN_MS - 60_000);
  assert.equal(progress.readyAt, claimedAt + DAILY_CLAIM_COOLDOWN_MS);
  assert.equal(progress.streakDeadline, claimedAt + DAILY_CLAIM_STREAK_WINDOW_MS);
});

for (const [offset, remaining] of [
  [DAILY_CLAIM_COOLDOWN_MS - 1, 1],
  [DAILY_CLAIM_COOLDOWN_MS, 0],
  [DAILY_CLAIM_COOLDOWN_MS + 1, 0],
]) {
  test(`cooldown boundary at ${offset}ms`, () => {
    const progress = getDailyClaimProgress(claim, claimedAt + offset);
    assert.equal(progress.remainingCooldownMs, remaining);
    assert.equal(progress.nextDay, 5);
    assert.equal(progress.expired, false);
  });
}

for (const offset of [
  DAILY_CLAIM_STREAK_WINDOW_MS - 1,
  DAILY_CLAIM_STREAK_WINDOW_MS,
  DAILY_CLAIM_STREAK_WINDOW_MS + 1,
]) {
  test(`streak boundary matches backend at ${offset}ms`, () => {
    const now = claimedAt + offset;
    const progress = getDailyClaimProgress(claim, now);
    const backend = calculateDailyClaimStreak({
      claimedAt: new Date(claimedAt).toISOString(),
      streakDay: claim.streakDay,
    }, new Date(now));
    assert.equal(progress.nextDay, backend.streakDay);
    assert.equal(progress.nextDrawEntries, backend.drawEntries);
    assert.equal(progress.expired, !backend.streakContinued);
    assert.equal(progress.completedDays, backend.streakContinued ? 4 : 0);
    assert.equal(progress.remainingStreakMs, Math.max(0, DAILY_CLAIM_STREAK_WINDOW_MS - offset));
  });
}

test("a completed day-seven cycle previews day one without erasing completed days", () => {
  const progress = getDailyClaimProgress({ ...claim, streakDay: 7, drawEntries: 5 }, claimedAt + DAILY_CLAIM_COOLDOWN_MS);
  assert.equal(progress.completedDays, 7);
  assert.equal(progress.cycleComplete, true);
  assert.equal(progress.nextDay, 1);
  assert.equal(progress.nextDrawEntries, 1);
});

test("every next-day preview matches the backend entry schedule", () => {
  for (let day = 1; day <= 7; day += 1) {
    const now = claimedAt + DAILY_CLAIM_COOLDOWN_MS;
    const progress = getDailyClaimProgress({ ...claim, streakDay: day }, now);
    const backend = calculateDailyClaimStreak({ claimedAt: new Date(claimedAt).toISOString(), streakDay: day }, new Date(now));
    assert.equal(progress.nextDay, backend.streakDay);
    assert.equal(progress.nextDrawEntries, backend.drawEntries);
  }
});

test("an open tab recomputes cooldown and expiry from the same stored claim", () => {
  assert.ok(getDailyClaimProgress(claim, claimedAt).remainingCooldownMs > 0);
  assert.equal(getDailyClaimProgress(claim, claimedAt + DAILY_CLAIM_COOLDOWN_MS).remainingCooldownMs, 0);
  assert.equal(getDailyClaimProgress(claim, claimedAt + DAILY_CLAIM_STREAK_WINDOW_MS + 1).completedDays, 0);
});
