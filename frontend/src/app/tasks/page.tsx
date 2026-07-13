'use client';

import { TaskList } from "@/components/TaskList";

export default function TasksPage() {
  const statCardClass = "ui-surface-strong relative overflow-hidden p-5 sm:p-6";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-32 top-24 h-80 w-80 rounded-full bg-blue-600/12 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl">
        <section className="ui-surface-strong relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Campaigns
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Available Campaigns
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Review live EPWX campaigns, verify reward density, and complete tasks on Base without leaving the rollout shell.
              </p>
            </div>
            <div className="ui-surface self-start px-4 py-3 text-sm text-slate-200">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Participation standard
              </div>
              <div className="mt-1 font-semibold text-white">Mobile-first task claiming</div>
              <div className="mt-1 text-slate-300">Live campaigns, reward visibility, and Base network focus.</div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className={statCardClass}>
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Campaigns</p>
                <p className="mt-2 text-2xl font-black text-white">Live on Base</p>
                <p className="mt-2 text-sm text-slate-300">Recent on-chain tasks surfaced from the campaign manager.</p>
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className={statCardClass}>
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Rewards</p>
                <p className="mt-2 text-2xl font-black text-white">EPWX Tokens</p>
                <p className="mt-2 text-sm text-slate-300">Consistent reward presentation before users enter a campaign flow.</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={statCardClass}>
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Network</p>
                <p className="mt-2 text-2xl font-black text-white">Base</p>
                <p className="mt-2 text-sm text-slate-300">Campaign completion and payout context stays aligned with the current chain.</p>
              </div>
              <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-3 text-blue-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <section className="ui-surface-strong mt-6 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Campaign board</p>
              <p className="mt-1 text-sm text-slate-300">Existing task contract reads and submission flows are preserved below.</p>
            </div>
            <div className="ui-status ui-status-success self-start">Base-ready</div>
          </div>
          <TaskList />
        </section>
      </main>
    </div>
  );
}
