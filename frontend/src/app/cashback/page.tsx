"use client";
import React from "react";
import { EPWXCashbackClaim } from "../../components/EPWXCashbackClaim_clean";

export default function CashbackPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-24 top-28 h-80 w-80 rounded-full bg-emerald-500/10 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <section className="ui-surface-strong relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Rewards
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                EPWX Cashback Rewards
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                Review eligible purchases, claim cashback within the active window, and keep the reward flow visually aligned with the rest of the rollout.
              </p>
            </div>
            <div className="ui-surface self-start px-4 py-3 text-sm text-slate-200">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Reward window
              </div>
              <div className="mt-1 font-semibold text-white">Last 3 hours</div>
              <div className="mt-1 text-slate-300">Qualifying EPWX buys above the current threshold appear below.</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="ui-surface relative overflow-hidden p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Claim flow</p>
              <p className="mt-2 text-2xl font-black text-white">Wallet-first</p>
              <p className="mt-2 text-sm text-slate-300">The claim component keeps the existing eligibility, signing, and backend flow unchanged.</p>
            </div>
            <div className="ui-surface relative overflow-hidden p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Threshold</p>
              <p className="mt-2 text-2xl font-black text-white">100B EPWX</p>
              <p className="mt-2 text-sm text-slate-300">Large purchases are surfaced for cashback review during the current claim window.</p>
            </div>
            <div className="ui-surface relative overflow-hidden p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-400/10 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payout mode</p>
              <p className="mt-2 text-2xl font-black text-white">EPWX</p>
              <p className="mt-2 text-sm text-slate-300">Users and admins continue using the same distribution paths already wired into the component.</p>
            </div>
          </div>
        </section>

        <section className="ui-surface-strong p-4 sm:p-6">
          <EPWXCashbackClaim />
        </section>
      </main>
    </div>
  );
}
