"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useSignMessage } from "wagmi";
import { parseJsonResponse } from "@/utils/apiErrors";

type CohortMetric = {
  eligible: number;
  returned: number;
  rate: number;
};

type RetentionAnalytics = {
  generatedAt: string;
  activity: {
    dailyActiveWallets: number;
    weeklyActiveWallets: number;
    monthlyActiveWallets: number;
  };
  walletMixLast30Days: {
    newWallets: number;
    returningWallets: number;
  };
  retention: {
    sevenDay: CohortMetric;
    thirtyDay: CohortMetric;
  };
  streaks: {
    activeWallets: number;
    distribution: Record<string, number>;
    daySevenWalletsLast30Days: number;
    daySevenCompletionRate: number;
    repeatClaimsLast30Days: number;
    resetClaimsLast30Days: number;
    resetRate: number;
  };
  rewards: {
    paidToReturningWalletsLast30Days: string;
    returningWallets: number;
    averagePaidPerReturningWallet: string;
  };
};

const panelClass = "rounded-lg border border-white/12 bg-white/[0.04]";

function getAdminWallets() {
  return String(process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
    .split(",")
    .map(wallet => wallet.trim().toLowerCase())
    .filter(Boolean);
}

function formatEpwx(value: string) {
  try {
    return `${BigInt(value).toLocaleString()} EPWX`;
  } catch {
    return "0 EPWX";
  }
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className={`${panelClass} min-w-0 p-4`}>
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{detail}</div>
    </div>
  );
}

export default function AdminRetentionPage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [analytics, setAnalytics] = useState<RetentionAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adminWallets = useMemo(() => getAdminWallets(), []);
  const isAdmin = Boolean(address && adminWallets.includes(address.toLowerCase()));

  const loadAnalytics = useCallback(async () => {
    if (!address || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const normalizedWallet = address.toLowerCase();
      const todayUtc = new Date().toISOString().slice(0, 10);
      const message = `EPWX Admin Retention Analytics\nWallet: ${normalizedWallet}\nDate: ${todayUtc}`;
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api/epwx/daily-claims/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: normalizedWallet, signature }),
        cache: "no-store",
      });
      const data = await parseJsonResponse<RetentionAnalytics>(response, "Unable to load retention analytics");
      setAnalytics(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load retention analytics");
    } finally {
      setLoading(false);
    }
  }, [address, isAdmin, signMessageAsync]);

  useEffect(() => {
    setAnalytics(null);
    setError(null);
  }, [address]);

  const maximumStreakCount = Math.max(1, ...Object.values(analytics?.streaks.distribution || {}));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Admin analytics</div>
            <h1 className="mt-2 text-3xl font-black text-white">Daily Claim retention</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Rolling activity, first-claim cohorts, streak health, and paid rewards for returning wallets.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">
              Claims admin
            </Link>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => void loadAnalytics()}
                disabled={loading}
                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
              >
                {loading ? "Waiting for signature..." : analytics ? "Refresh" : "Load analytics"}
              </button>
            ) : null}
          </div>
        </header>

        {!address ? (
          <section className={`${panelClass} p-6 text-center`}>
            <p className="text-lg font-bold text-white">Connect an admin wallet to view retention analytics.</p>
            <div className="mt-4"><ConnectKitButton /></div>
          </section>
        ) : !isAdmin ? (
          <section className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-5 text-rose-100">
            This wallet is not authorized to view admin analytics.
          </section>
        ) : null}

        {error ? <div className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-4 text-rose-100">{error}</div> : null}
        {isAdmin && loading && !analytics ? <div className={`${panelClass} p-6 text-slate-300`}>Loading retention analytics...</div> : null}

        {isAdmin && analytics ? (
          <>
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-xl font-black text-white">Active wallets</h2>
                <div className="text-xs text-slate-500">Updated {new Date(analytics.generatedAt).toLocaleString()}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Daily active" value={analytics.activity.dailyActiveWallets} detail="Unique wallets claiming in the last 24 hours" />
                <Metric label="Weekly active" value={analytics.activity.weeklyActiveWallets} detail="Unique wallets claiming in the last 7 days" />
                <Metric label="Monthly active" value={analytics.activity.monthlyActiveWallets} detail="Unique wallets claiming in the last 30 days" />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="mb-3 text-xl font-black text-white">Wallet acquisition mix</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="New wallets" value={analytics.walletMixLast30Days.newWallets} detail="First-ever claim occurred in the last 30 days" />
                  <Metric label="Existing wallets" value={analytics.walletMixLast30Days.returningWallets} detail="Claimed this month and first claimed before it" />
                </div>
              </div>
              <div>
                <h2 className="mb-3 text-xl font-black text-white">Return cohorts</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric
                    label="7-day return"
                    value={`${analytics.retention.sevenDay.rate}%`}
                    detail={`${analytics.retention.sevenDay.returned} of ${analytics.retention.sevenDay.eligible} mature new-wallet cohorts returned`}
                  />
                  <Metric
                    label="30-day return"
                    value={`${analytics.retention.thirtyDay.rate}%`}
                    detail={`${analytics.retention.thirtyDay.returned} of ${analytics.retention.thirtyDay.eligible} mature new-wallet cohorts returned`}
                  />
                </div>
              </div>
            </section>

            <section className={`${panelClass} p-5`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Active streak distribution</h2>
                  <p className="mt-1 text-sm text-slate-400">Latest claim is no more than 48 hours old.</p>
                </div>
                <div className="text-sm font-bold text-amber-200">{analytics.streaks.activeWallets} active streak wallets</div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-7">
                {Array.from({ length: 7 }, (_, index) => {
                  const day = String(index + 1);
                  const count = analytics.streaks.distribution[day] || 0;
                  const width = `${Math.max(count > 0 ? 8 : 0, (count / maximumStreakCount) * 100)}%`;
                  return (
                    <div key={day} className="min-w-0">
                      <div className="flex items-center justify-between text-xs text-slate-400 sm:block">
                        <span>Day {day}</span>
                        <span className="font-black text-white sm:mt-1 sm:block sm:text-lg">{count}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded bg-white/10">
                        <div className="h-full rounded bg-amber-300" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric label="Reached day 7" value={analytics.streaks.daySevenWalletsLast30Days} detail={`${analytics.streaks.daySevenCompletionRate}% of monthly active wallets`} />
                <Metric label="Repeat claims" value={analytics.streaks.repeatClaimsLast30Days} detail="Claims after a wallet's first-ever claim, last 30 days" />
                <Metric label="Reset rate" value={`${analytics.streaks.resetRate}%`} detail={`${analytics.streaks.resetClaimsLast30Days} non-cycle day-1 resets`} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-black text-white">Paid rewards to existing wallets</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Paid in 30 days" value={formatEpwx(analytics.rewards.paidToReturningWalletsLast30Days)} detail="Paid Daily Claims for existing active wallets" />
                <Metric label="Existing wallets" value={analytics.rewards.returningWallets} detail="Denominator for average paid reward" />
                <Metric label="Average per wallet" value={formatEpwx(analytics.rewards.averagePaidPerReturningWallet)} detail="Paid amount divided by existing active wallets" />
              </div>
            </section>

            <details className={`${panelClass} p-4 text-sm text-slate-300`}>
              <summary className="cursor-pointer font-bold text-white">Metric definitions</summary>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-6">
                <li>Activity windows are rolling 24-hour, 7-day, and 30-day periods.</li>
                <li>New versus existing is determined by the wallet&apos;s first-ever Daily Claim.</li>
                <li>Return rate measures whether a mature first-claim cohort submitted another claim within 7 or 30 days.</li>
                <li>A reset is a repeat claim recorded as day 1 unless the previous claim completed day 7.</li>
                <li>Reward totals include Daily Claims marked paid; pending rewards are excluded.</li>
              </ul>
            </details>
          </>
        ) : null}
      </div>
    </main>
  );
}