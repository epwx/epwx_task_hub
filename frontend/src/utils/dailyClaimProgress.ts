export const DAILY_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const DAILY_CLAIM_STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;
export const DAILY_CLAIM_ENTRY_SCHEDULE = [1, 1, 2, 2, 3, 3, 5] as const;

export interface LatestDailyClaim {
  claimedAt: number;
  streakDay: number;
  drawEntries: number;
}

export type DailyClaimHistory =
  | { wallet: string; status: "loading" }
  | { wallet: string; status: "ready"; claim: LatestDailyClaim | null }
  | { wallet: string; status: "error"; error: string };

function parseProgressNumber(value: unknown): number {
  if (value == null) return 1;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error("Daily claim history contains invalid progress.");
  }
  return Number(value);
}

export function parseLatestDailyClaim(data: unknown): LatestDailyClaim | null {
  if (!data || typeof data !== "object" || !("claims" in data) || !Array.isArray(data.claims)) {
    throw new Error("Daily claim history returned an invalid response.");
  }
  if (data.claims.length === 0) return null;

  const claim: unknown = data.claims[0];
  if (!claim || typeof claim !== "object" || !("claimedAt" in claim) || typeof claim.claimedAt !== "string") {
    throw new Error("Daily claim history is missing a valid claim time.");
  }
  const claimedAt = Date.parse(claim.claimedAt);
  const streakDay = parseProgressNumber("streakDay" in claim ? claim.streakDay : null);
  const drawEntries = parseProgressNumber("drawEntries" in claim ? claim.drawEntries : null);
  if (!Number.isFinite(claimedAt) || !Number.isInteger(streakDay) || streakDay < 1 || streakDay > 7
    || !Number.isInteger(drawEntries) || drawEntries < 1 || drawEntries > 5) {
    throw new Error("Daily claim history contains invalid progress.");
  }
  return { claimedAt, streakDay, drawEntries };
}

export function getDailyClaimProgress(claim: LatestDailyClaim | null, now: number) {
  const readyAt = claim ? claim.claimedAt + DAILY_CLAIM_COOLDOWN_MS : null;
  const streakDeadline = claim ? claim.claimedAt + DAILY_CLAIM_STREAK_WINDOW_MS : null;
  const expired = streakDeadline !== null && now > streakDeadline;
  const completedDays = claim && !expired ? claim.streakDay : 0;
  const nextDay = completedDays === 7 ? 1 : completedDays + 1;

  return {
    completedDays,
    nextDay,
    nextDrawEntries: DAILY_CLAIM_ENTRY_SCHEDULE[nextDay - 1],
    readyAt,
    streakDeadline,
    remainingCooldownMs: readyAt === null ? 0 : Math.max(0, readyAt - now),
    remainingStreakMs: streakDeadline === null ? 0 : Math.max(0, streakDeadline - now),
    expired,
    cycleComplete: completedDays === 7,
  };
}
