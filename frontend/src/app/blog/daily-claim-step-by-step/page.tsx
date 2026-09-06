import Link from "next/link";
import Image from "next/image";

const steps = [
  {
    title: "1. Connect your wallet",
    copy:
      "Start by opening EPWX Task Hub and connecting the wallet you want to use for daily participation. Wallet-based identity helps keep each claim auditable and tied to a real user account.",
    screenshotSrc: "/blog/daily-claim-step-01-connect-wallet.jpg",
    screenshotAlt: "Wallet and verification panel showing Connect Wallet button for daily claim",
    screenshotWidth: 1152,
    screenshotHeight: 1728,
    screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
  },
  {
    title: "2. Join the EPWX Telegram group",
    copy:
      "Join the official EPWX Telegram community before claiming. The daily claim flow is built for active community members, so Telegram membership is part of the reward verification model.",
    linkHref: "https://t.me/ePowerX_On_Base",
    linkText: "Join our group: https://t.me/ePowerX_On_Base",
  },
  {
    title: "3. Verify via Telegram",
    copy:
      "Complete Telegram verification so EPWX can connect your wallet activity with your community account. This helps confirm that claims come from real members, not anonymous repeat attempts.",
    screenshotSrc: "/blog/daily-claim-step-03-verify-telegram-part1.jpg",
    screenshotAlt: "Wallet connected panel showing Telegram status as not verified and button to verify membership",
    screenshotWidth: 1152,
    screenshotHeight: 1728,
    screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
    secondaryScreenshotSrc: "/blog/daily-claim-step-03-verify-telegram-part2.jpg",
    secondaryScreenshotAlt: "ePowerXBot Telegram chat showing /start command and Open Daily Claim Mini App button",
    secondaryScreenshotWidth: 1152,
    secondaryScreenshotHeight: 1728,
    secondaryScreenshotClassName: "mx-auto mt-3 h-auto w-full max-w-2xl rounded-lg",
  },
  {
    title: "4. Complete eligibility checks",
    copy:
      "EPWX runs backend eligibility and anti-abuse checks before enabling rewards. These checks protect the daily distribution model and keep the program fair for consistent participants.",
  },
  {
    title: "5. Claim your daily EPWX reward",
    copy:
      "Once connected, verified, and eligible, submit your daily claim. Make daily claiming part of your routine: connect, verify, claim, and repeat.",
    screenshotSrc: "/blog/daily-claim-step-05-claim-reward.jpg",
    screenshotAlt: "Daily claim screen showing Claim Daily Reward button and terms agreement checkbox",
    screenshotWidth: 1152,
    screenshotHeight: 1728,
    screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
  },
];

export default function DailyClaimStepByStepArticlePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-900/45 via-slate-900 to-emerald-950 p-6 shadow-2xl md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">EPWX Blog</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
          Claim EPWX Daily: Step-by-Step Guide for Long-Term Rewards
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
          EPWX Daily Claim is designed for consistent community participation, with wallet identity, Telegram
          verification, and eligibility checks keeping rewards transparent and fair for real members.
        </p>

        <div className="mt-5 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          <p className="font-bold">Daily claim link</p>
          <Link href="/#daily-claim" className="mt-1 inline-block font-semibold text-emerald-50 underline decoration-emerald-200/60 underline-offset-4">
            Open EPWX Daily Claim
          </Link>
        </div>

        <article className="mt-8 space-y-7 text-sm leading-7 text-slate-200 md:text-base">
          <section>
            <h2 className="text-2xl font-extrabold text-white">Why EPWX built daily claims</h2>
            <p className="mt-3 text-slate-300">
              Many reward programs are short-lived. EPWX is built around an ongoing participation model where active
              members can return daily, complete clear requirements, and build a repeatable reward habit over time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-white">How daily claim works</h2>
            <div className="mt-4 space-y-4">
              {steps.map((step) => (
                <div key={step.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-slate-300">{step.copy}</p>
                  {step.linkHref ? (
                    <div className="mt-3">
                      <a
                        href={step.linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center font-semibold text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
                      >
                        {step.linkText || step.linkHref}
                      </a>
                    </div>
                  ) : null}
                  {step.screenshotSrc ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-cyan-300/35 bg-cyan-300/5 p-2">
                      <Image
                        src={step.screenshotSrc}
                        alt={step.screenshotAlt || step.title}
                        width={step.screenshotWidth || 1152}
                        height={step.screenshotHeight || 1728}
                        className={step.screenshotClassName || "mx-auto h-auto w-full max-w-2xl rounded-lg"}
                      />
                      {step.secondaryScreenshotSrc ? (
                        <Image
                          src={step.secondaryScreenshotSrc}
                          alt={step.secondaryScreenshotAlt || step.title}
                          width={step.secondaryScreenshotWidth || 1152}
                          height={step.secondaryScreenshotHeight || 1728}
                          className={step.secondaryScreenshotClassName || "mx-auto mt-3 h-auto w-full max-w-2xl rounded-lg"}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-white">Built for real members</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-4">
                <p className="font-bold text-cyan-200">Wallet identity</p>
                <p className="mt-1 text-sm text-cyan-100/90">Claims are connected to wallet-based identity for traceability.</p>
              </div>
              <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4">
                <p className="font-bold text-emerald-200">Telegram verification</p>
                <p className="mt-1 text-sm text-emerald-100/90">Community membership is verified before daily rewards are enabled.</p>
              </div>
              <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
                <p className="font-bold text-amber-200">Eligibility checks</p>
                <p className="mt-1 text-sm text-amber-100/90">Backend checks help reduce abuse and keep distribution fair.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-white">Daily consistency over hype</h2>
            <p className="mt-3 text-slate-300">
              The EPWX vision is long-term, consistent rewards for active users, subject to platform rules, token
              availability, and program terms. Daily claiming is about steady participation, not guaranteed income.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-white">Who this is for</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
              <li>Community members who show up consistently.</li>
              <li>Long-term Web3 participants.</li>
              <li>Users who prefer transparent, repeatable reward flows.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4">
            <h2 className="text-xl font-extrabold text-white">Final note</h2>
            <p className="mt-2 font-semibold text-cyan-100">Connect. Verify. Claim. Repeat.</p>
          </section>
        </article>
      </section>
    </main>
  );
}
