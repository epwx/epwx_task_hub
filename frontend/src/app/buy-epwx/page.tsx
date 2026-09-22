"use client";

import { HomeSwapCard } from "@/components/HomeSwapCard";

export default function BuyEpwxPage() {
  return (
    <div className="relative overflow-hidden bg-slate-950 px-4 py-6 text-white sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-32 top-24 h-80 w-80 rounded-full bg-emerald-500/12 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-2xl">
        <HomeSwapCard />
      </main>
    </div>
  );
}