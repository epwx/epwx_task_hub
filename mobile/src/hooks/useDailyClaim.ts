import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DailyClaimEmailEligibility,
  DailyClaimRecord,
  getDailyClaimEmailEligibility,
  getDailyClaimHistory,
  getTelegramEligibility,
} from '../api';

const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;
const ENTRY_SCHEDULE = [1, 1, 2, 2, 3, 3, 5] as const;

export function useDailyClaim(wallet?: string | null) {
  const [claims, setClaims] = useState<DailyClaimRecord[]>([]);
  const [email, setEmail] = useState<DailyClaimEmailEligibility | null>(null);
  const [telegramVerified, setTelegramVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    if (!wallet) {
      setClaims([]);
      setEmail(null);
      setTelegramVerified(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [history, emailEligibility, telegram] = await Promise.all([
        getDailyClaimHistory(wallet),
        getDailyClaimEmailEligibility(wallet),
        getTelegramEligibility(wallet),
      ]);
      setClaims(history.claims);
      setEmail(emailEligibility);
      setTelegramVerified(telegram.verified);
      setNow(Date.now());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load daily claim status.');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const latestClaim = claims[0] || null;
  const progress = useMemo(() => {
    const claimedAt = latestClaim ? Date.parse(latestClaim.claimedAt) : null;
    const readyAt = claimedAt === null ? null : claimedAt + DAY_MS;
    const streakDeadline = claimedAt === null ? null : claimedAt + STREAK_WINDOW_MS;
    const remainingCooldownMs = readyAt === null ? 0 : Math.max(0, readyAt - now);
    const remainingStreakMs = streakDeadline === null ? 0 : Math.max(0, streakDeadline - now);
    const completedDays = latestClaim && remainingStreakMs > 0 ? Number(latestClaim.streakDay || 1) : 0;
    const nextDay = completedDays === 7 ? 1 : completedDays + 1;

    return {
      readyAt,
      streakDeadline,
      remainingCooldownMs,
      remainingStreakMs,
      completedDays,
      nextDay,
      nextDrawEntries: ENTRY_SCHEDULE[nextDay - 1],
      cycleComplete: completedDays === 7,
    };
  }, [latestClaim, now]);

  return {
    claims,
    latestClaim,
    email,
    telegramVerified,
    loading,
    error,
    progress,
    now,
    refresh,
  };
}

export function formatRemainingTime(milliseconds: number) {
  if (milliseconds <= 0) return 'Available now';
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
