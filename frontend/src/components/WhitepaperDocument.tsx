import Image from 'next/image';
import { WhitepaperAddress } from '@/components/WhitepaperAddress';
import { WhitepaperTokenSnapshot } from '@/components/WhitepaperTokenSnapshot';

const TOKEN_ADDRESS = '0xef5f5751cf3eca6cc3572768298b7783d33d60eb';
const TASK_MANAGER_ADDRESS = '0x792896b951380eBC7E52f370Ec6208c5D260A210';
const BASESCAN_ADDRESS_URL = 'https://basescan.org/address/';

const sectionClass = 'scroll-mt-24 border-t border-slate-200 py-12 dark:border-slate-800 md:py-16';
const eyebrowClass = 'text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300';
const cardClass = 'border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60';

const tableOfContents = [
  { number: '01', label: 'Token snapshot', href: '#token-snapshot' },
  { number: '02', label: 'Abstract', href: '#abstract' },
  { number: '03', label: 'Utility model', href: '#utility-model' },
  { number: '04', label: 'Architecture', href: '#architecture' },
  { number: '05', label: 'Security', href: '#security' },
  { number: '06', label: 'Official links', href: '#official-links' },
  { number: '07', label: 'Implementation', href: '#implementation' },
];

const tokenUtilities = [
  'Tiered daily claim rewards based on EPWX wallet balance',
  'Twitter retweet campaign rewards with campaign-level controls',
  'Telegram-gated community and special claim eligibility',
  'Merchant-linked promotional rewards',
  'Purchase-linked cashback claims for qualifying EPWX buys',
  'Escrow-backed task campaigns through the TaskManager contract',
];

const currentParameters = [
  { label: 'Base daily reward', value: '100,000', unit: 'EPWX' },
  { label: 'Mid-tier daily reward', value: '2,000,000', unit: 'EPWX' },
  { label: 'Bonus daily reward', value: '5,000,000', unit: 'EPWX' },
  { label: 'Mega-tier daily reward', value: '10,000,000', unit: 'EPWX' },
  { label: 'Twitter retweet default', value: '100,000', unit: 'EPWX' },
  { label: 'Special claim distribution', value: '1,000,000', unit: 'EPWX' },
  { label: 'Cashback reward', value: '1B', unit: 'EPWX' },
  { label: 'Cashback purchase threshold', value: '100B', unit: 'EPWX' },
  { label: 'Cashback window', value: '3', unit: 'hours' },
];

const architecture = [
  {
    number: '01',
    title: 'Frontend',
    detail: 'Next.js, TypeScript, Tailwind, ConnectKit, and Wagmi provide wallet connection, claims UI, admin controls, campaign pages, and public information pages.',
  },
  {
    number: '02',
    title: 'Backend',
    detail: 'Node.js, Express, PostgreSQL, Sequelize, Passport, and Ethers handle verification, persistence, admin checks, reward ledgers, and supply reporting.',
  },
  {
    number: '03',
    title: 'Verification',
    detail: 'Twitter OAuth, Telegram verification, wallet signatures, and duplicate checks help reduce fraudulent or low-quality claims.',
  },
  {
    number: '04',
    title: 'Contracts',
    detail: 'The TaskManager contract supports advertiser escrow, verifier approvals, pending rewards, and user reward claiming on Base.',
  },
];

const securityControls = [
  'Wallet signature verification for daily claims',
  'Wallet and IP cooldown enforcement to reduce repeated claims',
  'Twitter OAuth identity linking for social-task integrity',
  'Telegram verification for gated reward types',
  'Admin wallet allowlists for privileged endpoints',
  'Reward ledger entries with claim IDs, amounts, and transaction hashes',
];

const officialLinks = [
  { label: 'Telegram community', href: 'https://t.me/ePowerX_On_Base', value: '@ePowerX_On_Base' },
  { label: 'X / Twitter', href: 'https://x.com/epowex', value: '@epowex' },
  { label: 'Email', href: 'mailto:info@epowex.com', value: 'info@epowex.com' },
  { label: 'Website', href: 'https://tasks.epowex.com/', value: 'tasks.epowex.com' },
  { label: 'GitHub', href: 'https://github.com/epwx/epwx_task_hub', value: 'epwx/epwx_task_hub' },
];

const implementationRows = [
  {
    title: 'Live utility now',
    status: 'Operational',
    items: [
      'Daily claims with wallet-signature verification and 24-hour cooldown checks',
      'Social campaign creation, screenshot submission, and anti-duplicate claim rules',
      'Telegram verification for gated claim flows',
      'Cashback recording for qualifying EPWX purchase transactions',
      'Public supply APIs and a reward distribution ledger',
    ],
  },
  {
    title: 'Hybrid execution today',
    status: 'Current model',
    items: [
      'Daily, special, cashback, merchant, and social payouts are admin-reviewed or admin-executed',
      'Eligibility and fraud checks run in the application layer before payment',
      'Token transfers settle on Base and are recorded with transaction hashes',
    ],
  },
  {
    title: 'Contract-supported direction',
    status: 'Progressive decentralization',
    items: [
      'Advertiser-funded campaigns can escrow EPWX in the TaskManager contract',
      'Authorized verifiers can approve completions and accumulate user rewards on-chain',
      'More campaign logic can move on-chain over time',
    ],
  },
];

function SectionHeading({ number, label, title, description }: { number: string; label: string; title: string; description?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-[5rem_minmax(0,1fr)]">
      <div className="font-mono text-sm text-sky-600 dark:text-sky-400">{number}</div>
      <div>
        <div className={eyebrowClass}>{label}</div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">{title}</h2>
        {description ? <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">{description}</p> : null}
      </div>
    </div>
  );
}

export function WhitepaperDocument() {
  return (
    <main className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] border-l border-slate-200 bg-[radial-gradient(circle_at_30%_35%,rgba(14,165,233,0.16),transparent_42%),linear-gradient(135deg,transparent_0%,transparent_49%,rgba(14,165,233,0.08)_49%,rgba(14,165,233,0.08)_51%,transparent_51%,transparent_100%)] bg-[length:auto,34px_34px] dark:border-slate-800 lg:block" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20 lg:px-10 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-20">
            <div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex items-center gap-3">
                  <Image src="/logo.webp" alt="EPWX" width={48} height={48} className="h-10 w-10" priority />
                  <span className="text-sm font-bold tracking-[0.18em] text-slate-950 dark:text-white">EPWX</span>
                </div>
                <span className="h-5 w-px bg-slate-300 dark:bg-slate-700" />
                <span className={eyebrowClass}>Official whitepaper · Version 1.0</span>
              </div>
              <h1 className="mt-10 max-w-4xl text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-slate-950 dark:text-white sm:text-6xl md:text-7xl">
                Verifiable rewards,
                <span className="block text-sky-600 dark:text-sky-400">built for real utility.</span>
              </h1>
              <p className="mt-8 max-w-2xl border-l-2 border-sky-500 pl-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                EPWX powers daily rewards, community verification, social growth, merchant promotions, cashback incentives, and escrow-capable task campaigns on Base.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#utility-model" className="bg-sky-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-sky-700">
                  Explore the utility model
                </a>
                <a
                  href={`${BASESCAN_ADDRESS_URL}${TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition-colors hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-500 dark:hover:text-sky-300"
                >
                  View token on BaseScan ↗
                </a>
              </div>
            </div>

            <div className="border-t-2 border-slate-950 bg-white/80 pt-6 backdrop-blur dark:border-white dark:bg-slate-950/80">
              <div className="flex items-center justify-between">
                <span className={eyebrowClass}>Deployment</span>
                <span className="border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300">Base network</span>
              </div>
              <div className="mt-6 space-y-5">
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">EPWX token</div>
                  <WhitepaperAddress address={TOKEN_ADDRESS} href={`${BASESCAN_ADDRESS_URL}${TOKEN_ADDRESS}`} compact />
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">TaskManager</div>
                  <WhitepaperAddress address={TASK_MANAGER_ADDRESS} href={`${BASESCAN_ADDRESS_URL}${TASK_MANAGER_ADDRESS}`} compact />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden" aria-label="Whitepaper sections">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-4 sm:px-8">
          {tableOfContents.map((item) => (
            <a key={item.href} href={item.href} className="shrink-0 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <span className="mr-2 font-mono text-sky-600 dark:text-sky-400">{item.number}</span>{item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:px-10">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 py-16" aria-label="Whitepaper contents">
            <div className={eyebrowClass}>Contents</div>
            <ol className="mt-6 space-y-4 border-l border-slate-200 pl-4 text-sm dark:border-slate-800">
              {tableOfContents.map((item) => (
                <li key={item.href}>
                  <a className="group flex gap-3 text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300" href={item.href}>
                    <span className="font-mono text-xs text-slate-400 group-hover:text-sky-500">{item.number}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="min-w-0">
          <WhitepaperTokenSnapshot />

          <section className="border-t border-slate-200 py-10 dark:border-slate-800">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className={eyebrowClass}>Utility surfaces</div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">One token, repeatable participation</h2>
              </div>
              <span className="hidden text-sm text-slate-500 dark:text-slate-400 md:block">Six active reward pathways</span>
            </div>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {tokenUtilities.map((utility, index) => (
                <div key={utility} className="flex gap-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <span className="font-mono text-xs text-sky-600 dark:text-sky-400">{String(index + 1).padStart(2, '0')}</span>
                  <span>{utility}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="abstract" className={sectionClass}>
            <SectionHeading
              number="02"
              label="Abstract"
              title="A hybrid utility layer for measurable participation"
              description="EPWX Task Hub combines social engagement campaigns, Telegram-gated community participation, merchant-linked rewards, qualifying cashback claims, and transparent distribution records into a single Base-based utility layer."
            />
            <p className="mt-8 max-w-4xl text-base leading-8 text-slate-700 dark:text-slate-300 md:ml-20">
              The current stack is intentionally hybrid: user eligibility, identity checks, claim rules, and anti-abuse controls run in the application layer, while token transfers settle on Base and are recorded for auditability.
            </p>
          </section>

          <section id="utility-model" className={sectionClass}>
            <SectionHeading
              number="03"
              label="Utility model"
              title="Recurring utility, not a one-off campaign"
              description="EPWX is integrated into retention loops, social growth loops, merchant promotion loops, and purchase-linked cashback flows."
            />
            <div className="mt-10 grid gap-12 xl:grid-cols-[0.8fr_1.2fr] xl:pl-20">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Current reward surfaces</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {[
                    'Daily claims reward ongoing participation and larger aligned balances.',
                    'Social campaigns convert measurable engagement into reward activity.',
                    'Special claims support targeted community distributions.',
                    'Merchant and cashback rewards connect utility to commerce and market activity.',
                    'Escrow-backed task campaigns support advertiser-funded incentive programs.',
                  ].map((item) => <li key={item} className="border-l border-sky-500 pl-4">{item}</li>)}
                </ul>
              </div>
              <div>
                <div className={eyebrowClass}>Current parameters</div>
                <div className="mt-5 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800">
                  {currentParameters.map((item) => (
                    <div key={item.label} className="border-b border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                      <div className="text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-slate-500 dark:text-slate-400">{item.label}</div>
                      <div className="mt-3 text-xl font-bold tracking-tight text-slate-950 dark:text-white">{item.value}</div>
                      <div className="mt-1 text-xs font-semibold text-sky-700 dark:text-sky-300">{item.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="architecture" className={sectionClass}>
            <SectionHeading
              number="04"
              label="Architecture"
              title="Clear layers, auditable settlement"
              description="The platform separates user experience, verification, persistence, and settlement while keeping every reward flow measurable."
            />
            <div className="mt-10 grid border-l border-t border-slate-200 md:grid-cols-2 xl:grid-cols-4 dark:border-slate-800">
              {architecture.map((item) => (
                <article key={item.title} className="relative border-b border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="font-mono text-sm text-sky-600 dark:text-sky-400">{item.number}</div>
                  <h3 className="mt-8 text-xl font-bold text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="security" className={sectionClass}>
            <SectionHeading
              number="05"
              label="Security and transparency"
              title="Controls at every reward boundary"
              description="Application-layer safeguards reduce repeated or low-quality claims, while Base settlement and public supply reporting preserve auditability."
            />
            <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:pl-20">
              <div className={cardClass}>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Security and anti-abuse</h3>
                <ul className="mt-5 space-y-3">
                  {securityControls.map((control) => (
                    <li key={control} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-sky-500" />
                      <span>{control}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cardClass}>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Supply transparency</h3>
                <p className="mt-5 text-sm leading-8 text-slate-600 dark:text-slate-300">
                  Public APIs expose total, circulating, and burned supply. Circulating supply is derived from on-chain total supply minus burned and treasury-locked balances, formatted at 9 decimals for listing platforms, analytics dashboards, and ecosystem monitoring.
                </p>
                <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Settlement network</span>
                  <div className="mt-2 text-xl font-bold text-slate-950 dark:text-white">Base</div>
                </div>
              </div>
            </div>
          </section>

          <section id="official-links" className={sectionClass}>
            <SectionHeading number="06" label="Official links" title="Verified EPWX channels" />
            <div className="mt-10 grid border-l border-t border-slate-200 md:grid-cols-2 xl:grid-cols-3 dark:border-slate-800">
              {officialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  className="group border-b border-r border-slate-200 bg-white p-5 transition-colors hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-sky-950/30"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{link.label}</div>
                    <span className="text-sky-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-sky-400">↗</span>
                  </div>
                  <div className="mt-3 break-words text-base font-bold text-slate-900 dark:text-white">{link.value}</div>
                </a>
              ))}
            </div>
          </section>

          <section id="implementation" className={sectionClass}>
            <SectionHeading
              number="07"
              label="Implementation status"
              title="Working utility with a clear path forward"
              description="The current platform is operational today, combines application verification with on-chain settlement, and supports progressively moving more campaign logic on-chain."
            />
            <div className="mt-10 grid gap-px bg-slate-200 lg:grid-cols-3 dark:bg-slate-800">
              {implementationRows.map((row) => (
                <article key={row.title} className="bg-white p-6 dark:bg-slate-900">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">{row.status}</div>
                  <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">{row.title}</h3>
                  <ul className="mt-5 space-y-3">
                    {row.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 border border-sky-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 py-14 dark:border-slate-800 md:py-20">
            <div className="bg-slate-950 px-6 py-10 text-white dark:bg-slate-900 md:px-10 md:py-12">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">08 · Conclusion</div>
              <p className="mt-5 max-w-4xl text-2xl font-semibold leading-relaxed tracking-tight text-white md:text-3xl">
                EPWX is already embedded into repeatable actions that users, merchants, campaign operators, and partners can understand, measure, and expand.
              </p>
              <a href="/tasks" className="mt-8 inline-block border-b border-sky-400 pb-1 text-sm font-bold text-sky-300 hover:text-white">
                Explore active campaigns →
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
