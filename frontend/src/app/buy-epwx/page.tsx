"use client";

import { HomeSwapCard } from "@/components/HomeSwapCard";

export default function BuyEpwxPage() {
  return (
    <div className="relative overflow-hidden bg-slate-950 px-4 py-8 text-white sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-32 top-24 h-80 w-80 rounded-full bg-emerald-500/12 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <section className="ui-surface-strong relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Base Swap</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Buy EPWX</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              Swap Base ETH into EPWX, review the estimated output, and move your wallet toward higher daily reward tiers.
            </p>
          </div>
        </section>

        <HomeSwapCard />
      </main>
    </div>
  );
}