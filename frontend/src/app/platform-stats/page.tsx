import { EPWXStats } from "@/components/EPWXStats";

export default function PlatformStatsPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-950 text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-36 top-12 h-80 w-80 rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-600/18 blur-[150px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:py-14">
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_45px_rgba(2,6,23,0.45)] backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Market Console</div>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Platform Stats</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Live EPWX market, liquidity, and contract telemetry for Base network operations.
              </p>
            </div>
            <div className="ui-status ui-status-success">Live Feed</div>
          </div>
        </section>

        <EPWXStats />
      </main>
    </div>
  );
}
