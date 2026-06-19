"use client";

export default function TwitterRetweetClaimPageWrapper() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-xl text-center text-white">
          <div className="text-xs uppercase tracking-[0.35em] text-white/70">Program Update</div>
          <h1 className="mt-3 text-4xl font-black">X Engagement Claims Paused</h1>
          <p className="mt-3 text-sm text-white/85">
            This legacy route is disabled. Please use the daily claim flow on the home page for active reward programs.
          </p>
          <p className="mt-2 text-xs text-white/65">This program is not sponsored by, endorsed by, or affiliated with X.</p>
          <a href="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100">
            Back To Home
          </a>
        </div>
      </div>
    </div>
  );
}