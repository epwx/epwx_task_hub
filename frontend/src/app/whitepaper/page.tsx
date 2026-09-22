import type { Metadata } from "next";
import Image from "next/image";
import { WhitepaperTokenSnapshot } from "@/components/WhitepaperTokenSnapshot";

const utilityPillClass = "border-l border-sky-500 pl-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300";
const sectionClass = "scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800 md:py-14";

const tableOfContents = [
  { label: "Token snapshot", href: "#token-snapshot" },
  { label: "Abstract", href: "#abstract" },
  { label: "Utility model", href: "#utility-model" },
  { label: "Architecture", href: "#architecture" },
  { label: "Security", href: "#security" },
  { label: "Official links", href: "#official-links" },
  { label: "Implementation", href: "#implementation" },
];

const tokenUtilities = [
  "Tiered daily claim rewards based on EPWX wallet balance",
  "Twitter retweet campaign rewards with campaign-level controls",
  "Telegram-gated community and special claim eligibility",
  "Merchant-linked promotional rewards",
  "Purchase-linked cashback claims for qualifying EPWX buys",
  "Escrow-backed task campaigns through the TaskManager contract",
];

const implementationRows = [
  {
    title: "Live utility now",
    items: [
      "Daily claims with wallet-signature verification and 24-hour cooldown checks",
      "Social engagement campaign creation, screenshot submission, and anti-duplicate claim rules",
      "Telegram verification for gated claim flows",
      "Cashback claim recording for qualifying EPWX purchase transactions",
      "Public total, circulating, and burned supply APIs",
      "Reward distribution ledger for paid claims",
    ],
  },
  {
    title: "Hybrid execution today",
    items: [
      "Daily, special, cashback, merchant, and Twitter retweet payouts are currently admin-reviewed or admin-executed",
      "Eligibility and fraud checks run in the application layer before payment",
      "Token transfers settle on Base and are recorded with transaction hashes",
    ],
  },
  {
    title: "Contract-supported direction",
    items: [
      "Advertiser-funded campaigns can escrow EPWX in the TaskManager contract",
      "Authorized verifiers can approve completions and accumulate user rewards on-chain",
      "The architecture supports progressively moving more campaign logic on-chain over time",
    ],
  },
];

const currentParameters = [
  { label: "Base daily reward", value: "100,000 EPWX" },
  { label: "Mid-tier daily reward", value: "2,000,000 EPWX" },
  { label: "Bonus daily reward", value: "5,000,000 EPWX" },
  { label: "Mega-tier daily reward", value: "10,000,000 EPWX" },
  { label: "Twitter retweet default", value: "100,000 EPWX" },
  { label: "Special claim admin distribution", value: "1,000,000 EPWX" },
  { label: "Cashback reward", value: "1,000,000,000 EPWX" },
  { label: "Cashback purchase threshold", value: "100,000,000,000 EPWX" },
  { label: "Cashback window", value: "Last 3 hours" },
];

const securityControls = [
  "Wallet signature verification for daily claims",
  "Wallet and IP cooldown enforcement to reduce repeated claims",
  "Twitter OAuth identity linking for social-task integrity",
  "Telegram verification for gated reward types",
  "Admin wallet allowlists for privileged endpoints",
  "Reward ledger entries with claim IDs, amounts, and transaction hashes",
];

const officialLinks = [
  {
    label: "Telegram Group",
    href: "https://t.me/ePowerX_On_Base",
    value: "@ePowerX_On_Base",
  },
  {
    label: "X / Twitter",
    href: "https://x.com/epowex",
    value: "@epowex",
  },
  {
    label: "Email",
    href: "mailto:info@epowex.com",
    value: "info@epowex.com",
  },
  {
    label: "Website",
    href: "https://tasks.epowex.com/",
    value: "tasks.epowex.com",
  },
  {
    label: "GitHub",
    href: "https://github.com/epwx/epwx_task_hub",
    value: "epwx/epwx_task_hub",
  },
];

export const metadata: Metadata = {
  title: "EPWX Whitepaper",
  description: "Official EPWX utility whitepaper covering token utility, reward flows, platform architecture, security controls, and current implementation status.",
  alternates: {
    canonical: "/whitepaper",
  },
  openGraph: {
    title: "EPWX Whitepaper",
    description: "Official EPWX utility whitepaper covering token utility, reward flows, platform architecture, and security controls.",
    url: "/whitepaper",
    siteName: "EPWX Task Hub",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "EPWX Whitepaper",
    description: "Official EPWX utility whitepaper for partners, exchanges, and listing platforms.",
  },
};

export default function WhitepaperPage() {
  return (
    <>
      <main className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] border-l border-slate-200 bg-[linear-gradient(135deg,transparent_0%,transparent_49%,rgba(14,165,233,0.08)_49%,rgba(14,165,233,0.08)_51%,transparent_51%,transparent_100%)] bg-[length:28px_28px] dark:border-slate-800 dark:bg-[linear-gradient(135deg,transparent_0%,transparent_49%,rgba(56,189,248,0.08)_49%,rgba(56,189,248,0.08)_51%,transparent_51%,transparent_100%)] lg:block" />
          <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16 lg:px-10 lg:py-20">
            <div className="flex flex-wrap gap-x-7 gap-y-3">
              <span className={utilityPillClass}>Official Whitepaper</span>
              <span className={utilityPillClass}>Base Network</span>
              <span className={utilityPillClass}>Version 1.0</span>
            </div>
            <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-20">
              <div>
                <div className="mb-7 inline-flex border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <Image
                    src="/logo.webp"
                    alt="EPWX logo"
                    width={180}
                    height={48}
                    className="h-10 w-auto"
                    priority
                  />
                </div>
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] text-slate-950 dark:text-white sm:text-5xl md:text-6xl">
                  Utility infrastructure for verifiable rewards
                </h1>
                <p className="mt-7 max-w-2xl border-l-2 border-sky-500 pl-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                  EPWX is a utility token powering daily rewards, community verification, social growth campaigns, merchant promotions,
                  cashback incentives, and escrow-capable task campaigns on Base.
                </p>
              </div>
              <div className="border-t-2 border-slate-950 bg-white/90 pt-5 dark:border-white dark:bg-slate-950/90">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Core contracts</div>
                <div className="mt-5 space-y-5 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">EPWX Token</div>
                    <div className="mt-1 break-all font-mono leading-5">0xef5f5751cf3eca6cc3572768298b7783d33d60eb</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">TaskManager</div>
                    <div className="mt-1 break-all font-mono leading-5">0x792896b951380eBC7E52f370Ec6208c5D260A210</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:px-10">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 py-14" aria-label="Whitepaper contents">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Contents</div>
              <ol className="mt-5 space-y-3 border-l border-slate-200 pl-4 text-sm dark:border-slate-800">
                {tableOfContents.map((item, index) => (
                  <li key={item.href}>
                    <a className="group flex gap-3 text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300" href={item.href}>
                      <span className="font-mono text-xs text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
          <div className="min-w-0">
            <WhitepaperTokenSnapshot />

        <section className="border-t border-slate-200 py-8 dark:border-slate-800 md:py-10">
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {tokenUtilities.map((utility) => (
              <div key={utility} className="flex gap-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-sky-500" />
                <span>{utility}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16 md:pb-20">
          <div id="abstract" className={sectionClass}>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">01 / Abstract</div>
            <p className="mt-4 max-w-4xl text-base leading-8 text-slate-700 dark:text-slate-300">
              EPWX Task Hub combines social engagement campaigns, Telegram-gated community participation, merchant-linked rewards,
              qualifying cashback claims, and transparent distribution records into a single Base-based utility layer. The current
              stack is intentionally hybrid: user eligibility, identity checks, claim rules, and anti-abuse controls run in the application
              layer, while token transfers settle on Base and are recorded for auditability.
            </p>
          </div>

          <div id="utility-model" className={`${sectionClass} grid gap-10 xl:grid-cols-[1fr_0.9fr]`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">02 / Utility model</div>
              <div className="mt-5 space-y-6 text-slate-700 dark:text-slate-300">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">Why EPWX has recurring utility</h2>
                  <p className="mt-3 text-base leading-8">
                    EPWX is designed to be used across repeated user actions rather than a single one-off campaign. The token is integrated
                    into retention loops, social growth loops, merchant promotion loops, and purchase-linked cashback flows.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">Current reward surfaces</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-7">
                    <li>Daily claims that reward ongoing participation and larger aligned balances.</li>
                    <li>Twitter retweet campaigns that convert social engagement into measurable reward activity.</li>
                    <li>Special claims that support targeted community distributions.</li>
                    <li>Merchant rewards that introduce EPWX to local commerce and customer acquisition.</li>
                    <li>Cashback claims that tie utility to qualifying EPWX market activity.</li>
                    <li>Escrow-backed task campaigns for advertiser-funded incentive programs.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Current parameters</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {currentParameters.map((item) => (
                  <div key={item.label} className="border-b border-slate-200 py-3 dark:border-slate-800">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{item.label}</div>
                    <div className="mt-2 text-base font-bold text-slate-900 dark:text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="architecture" className={sectionClass}>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">03 / Architecture</div>
            <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Frontend</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  Next.js, TypeScript, Tailwind, ConnectKit, and Wagmi provide wallet connection, claims UI, admin controls,
                  campaign pages, and public information pages.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Backend</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  Node.js, Express, PostgreSQL, Sequelize, Passport, and Ethers handle verification, persistence, admin checks,
                  reward ledgers, and supply reporting.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Verification</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  Twitter OAuth, Telegram verification, wallet signatures, and duplicate checks help reduce fraudulent or low-quality claims.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Contracts</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  The TaskManager contract supports advertiser escrow, verifier approvals, pending rewards, and user reward claiming on Base.
                </p>
              </div>
            </div>
          </div>

          <div id="security" className="scroll-mt-24 grid gap-8 lg:grid-cols-2">
            <div className={sectionClass}>
              <div className="text-sm font-bold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-300">Security and anti-abuse</div>
              <ul className="mt-5 list-disc space-y-3 pl-6 text-sm leading-7 text-slate-700 dark:text-slate-300">
                {securityControls.map((control) => (
                  <li key={control}>{control}</li>
                ))}
              </ul>
            </div>

            <div className={sectionClass}>
              <div className="text-sm font-bold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-300">Supply transparency</div>
              <p className="mt-5 text-sm leading-8 text-slate-700 dark:text-slate-300">
                EPWX Task Hub exposes public APIs for total supply, circulating supply, and burned supply. Circulating supply is derived
                from on-chain total supply minus burned balances and treasury-locked balances, with values formatted at 9 decimals. This
                supports listing applications, analytics dashboards, and third-party ecosystem monitoring.
              </p>
            </div>
          </div>

          <div id="official-links" className={sectionClass}>
            <div className="text-sm font-bold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-300">Official links</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {officialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-sky-300 hover:bg-sky-50/70 dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-sky-500/50 dark:hover:bg-slate-800"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{link.label}</div>
                  <div className="mt-2 text-base font-bold text-slate-900 dark:text-white">{link.value}</div>
                  <div className="mt-2 break-all text-sm text-slate-600 dark:text-slate-300">{link.href}</div>
                </a>
              ))}
            </div>
          </div>

          <div id="implementation" className={sectionClass}>
            <div className="text-sm font-bold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-300">Implementation status</div>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              {implementationRows.map((row) => (
                <div key={row.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/70">
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">{row.title}</h2>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    {row.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className={sectionClass}>
            <div className="text-sm font-bold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-300">Conclusion</div>
            <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700 dark:text-slate-300">
              EPWX is positioned as a working utility token across daily rewards, verified social participation, merchant promotions,
              qualifying cashback, and advertiser-funded campaigns on Base. The most important characteristic of the platform is not a
              single reward size. It is the fact that EPWX is already embedded into repeatable actions that users, admins, merchants,
              and campaign operators can understand, measure, and expand over time.
            </p>
          </div>
        </section>
          </div>
        </div>
      </main>
    </>
  );
}