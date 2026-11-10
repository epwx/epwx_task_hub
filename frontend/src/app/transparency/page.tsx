import type { Metadata } from 'next';
import { WhitepaperAddress } from '@/components/WhitepaperAddress';
import { TransparencySupplyFigures } from '@/components/TransparencySupplyFigures';
import { EPWX_TOKEN_ADDRESS, EPWX_WETH_PAIR_ADDRESS, EPWX_DECIMALS } from '@/utils/epwxMarket';

const SITE_URL = 'https://tasks.epowex.com';
const PUBLIC_API_URL = 'https://api.epowex.com';
const BASE_CHAIN_ID = 8453;
const BURN_ADDRESS = '0x0000000000000000000000000000000000000000';
const BICONOMY_CUSTODY_ADDRESS = '0xfdb836cdcdcfeb34b309a7bd5dc1adfaa63690d3';

const basescanToken = `https://basescan.org/token/${EPWX_TOKEN_ADDRESS}`;
const basescanHolder = (address: string) => `${basescanToken}?a=${address}`;
const basescanAddress = (address: string) => `https://basescan.org/address/${address}`;

export const metadata: Metadata = {
  title: 'EPWX Token Transparency',
  description:
    'Verifiable facts about the ePowerX On Base (EPWX) token: contract status, live supply, burn, largest holders, markets, and public supply APIs for listing reviewers.',
  alternates: { canonical: '/transparency' },
  openGraph: {
    title: 'EPWX Token Transparency',
    description: 'Contract, supply, burn, holder, and market facts for ePowerX On Base (EPWX), with live public APIs.',
    url: '/transparency',
    siteName: 'EPWX Task Hub',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EPWX Token Transparency',
    description: 'Everything a listing reviewer checks about EPWX, in one place.',
  },
};

const contractFacts = [
  { label: 'Display name', value: 'ePowerX On Base' },
  { label: 'On-chain name', value: 'ePowerX' },
  { label: 'Ticker', value: 'EPWX' },
  { label: 'Network', value: `Base (chain ID ${BASE_CHAIN_ID})` },
  { label: 'Standard', value: 'ERC-20' },
  { label: 'Decimals', value: String(EPWX_DECIMALS) },
  { label: 'Source code', value: 'Verified on BaseScan' },
  { label: 'Ownership', value: 'Renounced (owner is the zero address)' },
  { label: 'Minting', value: 'Not mintable; supply can only decrease through burns' },
  { label: 'Transfer tax', value: '6% buy / 5.9% sell, applied by the contract' },
  { label: 'First liquidity', value: '2025-06-25, PancakeSwap v2 EPWX/WETH on Base' },
];

const holders = [
  {
    name: 'Burn address',
    address: BURN_ADDRESS,
    href: basescanHolder(BURN_ADDRESS),
    role: 'Permanent burn. Tokens here can never move. Excluded from total and circulating supply.',
    share: '93.67% of the original mint',
  },
  {
    name: 'Biconomy exchange custody',
    address: BICONOMY_CUSTODY_ADDRESS,
    href: basescanHolder(BICONOMY_CUSTODY_ADDRESS),
    role: 'Third-party exchange wallet holding Biconomy user deposits and the EPWX paid for the Biconomy listing and marketing package. Not a team or treasury wallet; counted as circulating.',
    share: 'Largest non-burn holder',
  },
  {
    name: 'PancakeSwap v2 pool',
    address: EPWX_WETH_PAIR_ADDRESS,
    href: basescanAddress(EPWX_WETH_PAIR_ADDRESS),
    role: 'Primary on-chain liquidity pool, EPWX/WETH.',
    share: 'Liquidity',
  },
];

const markets = [
  {
    venue: 'Biconomy (centralized exchange)',
    pair: 'EPWX / USDT',
    href: 'https://www.biconomy.com/exchange/EPWX_USDT',
    note: 'Primary volume venue. Public ticker: biconomy.com/api/v1/tickers.',
  },
  {
    venue: 'PancakeSwap v2 on Base',
    pair: 'EPWX / WETH',
    href: `https://pancakeswap.finance/swap?chain=base&outputCurrency=${EPWX_TOKEN_ADDRESS}`,
    note: 'Main decentralized pool. Charts on GeckoTerminal, DEXTools, and DexScreener.',
  },
  {
    venue: 'Uniswap v2 on Base',
    pair: 'EPWX / WETH',
    href: `https://app.uniswap.org/swap?chain=base&outputCurrency=${EPWX_TOKEN_ADDRESS}`,
    note: 'Secondary pool with limited depth.',
  },
];

const supplyApis = [
  { label: 'Total supply', path: '/api/supply', note: 'On-chain total supply minus burned tokens.' },
  { label: 'Circulating supply', path: '/api/circulating', note: 'Total supply minus burned and treasury-locked balances.' },
  { label: 'Burned supply', path: '/api/burned', note: 'Balance of the burn address.' },
];

const reviewerLinks = [
  { label: 'Website', value: SITE_URL },
  { label: 'Whitepaper', value: `${SITE_URL}/whitepaper` },
  { label: 'Logo (1000x1000 WebP)', value: `${SITE_URL}/logo.webp` },
  { label: 'Terms of Service', value: `${SITE_URL}/terms` },
  { label: 'Privacy Policy', value: `${SITE_URL}/privacy` },
  { label: 'X / Twitter', value: 'https://x.com/epowex' },
  { label: 'Telegram', value: 'https://t.me/ePowerX_On_Base' },
  { label: 'Contact', value: 'info@epowex.com' },
];

const sectionClass = 'scroll-mt-24 border-t border-slate-200 py-12 dark:border-slate-800 md:py-16';
const eyebrowClass = 'text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300';
const cardClass = 'border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60';
const externalLinkClass = 'font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-sky-300';

export default function TransparencyPage() {
  return (
    <main className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 md:py-20">
          <div className={eyebrowClass}>Token transparency</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
            ePowerX On Base (EPWX): the facts behind the numbers
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-300">
            This page collects everything a listing reviewer, analyst, or holder checks about EPWX: the contract, the live supply, the
            burn, the largest wallets, where the token trades, and the public APIs that make each figure verifiable. Every number links
            to its on-chain source.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
            {[
              ['#contract', 'Contract'],
              ['#supply', 'Supply'],
              ['#holders', 'Holders'],
              ['#markets', 'Markets'],
              ['#apis', 'Public APIs'],
              ['#reviewers', 'For reviewers'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300">
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <section id="contract" className={sectionClass}>
          <div className={eyebrowClass}>Contract</div>
          <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">One contract, verified and immutable</h2>
          <div className={`mt-6 ${cardClass}`}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Token contract on Base</div>
            <div className="mt-3">
              <WhitepaperAddress address={EPWX_TOKEN_ADDRESS} href={basescanToken} />
            </div>
          </div>
          <dl className="mt-6 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800 md:grid-cols-2">
            {contractFacts.map((fact) => (
              <div key={fact.label} className="bg-white p-4 dark:bg-slate-900/60">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{fact.label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
            The on-chain token name is <span className="font-semibold">ePowerX</span>. The project uses the display name
            <span className="font-semibold"> ePowerX On Base</span> across its website, social channels, and listings to distinguish the Base
            deployment. Both names refer to the same contract above.
          </p>
        </section>

        <section id="supply" className={sectionClass}>
          <div className={eyebrowClass}>Supply</div>
          <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Live supply, net of burns</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300">
            The figures below are fetched from the public supply APIs each time this page loads. Most of the original mint was sent to
            the burn address and is permanently out of circulation; indexers that read the raw minted amount from the contract will show a
            much larger number than the live total here.
          </p>
          <div className="mt-6">
            <TransparencySupplyFigures />
          </div>
        </section>

        <section id="holders" className={sectionClass}>
          <div className={eyebrowClass}>Holders</div>
          <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">The wallets that explain the distribution</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300">
            EPWX has more than 12,000 holders. Two addresses dominate the raw holder list and are frequently misread by automated scans,
            so they are identified here. Neither is controlled by the project team.
          </p>
          <div className="mt-6 grid gap-4">
            {holders.map((holder) => (
              <div key={holder.address} className={cardClass}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-base font-bold text-slate-900 dark:text-white">{holder.name}</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">{holder.share}</div>
                </div>
                <div className="mt-3">
                  <WhitepaperAddress address={holder.address} href={holder.href} />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{holder.role}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
            Full holder list:{' '}
            <a href={`${basescanToken}#balances`} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
              BaseScan token holders
            </a>
            .
          </p>
        </section>

        <section id="markets" className={sectionClass}>
          <div className={eyebrowClass}>Markets</div>
          <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Where EPWX trades</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {markets.map((market) => (
              <a key={market.venue} href={market.href} target="_blank" rel="noopener noreferrer" className={`${cardClass} block transition-colors hover:border-sky-400 dark:hover:border-sky-500`}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{market.venue}</div>
                <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{market.pair}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{market.note}</p>
              </a>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
            Price and volume data are also indexed by GeckoTerminal, DEXTools, DexScreener, DexPaprika, Coinboom, and Moontok. EPWX is not
            yet listed on CoinGecko or CoinMarketCap.
          </p>
        </section>

        <section id="apis" className={sectionClass}>
          <div className={eyebrowClass}>Public APIs</div>
          <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Supply endpoints for aggregators</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300">
            Each endpoint returns a single plain number formatted at {EPWX_DECIMALS} decimals, refreshed from chain. They are free to use and
            suitable for the supply fields on CoinGecko, CoinMarketCap, Coinranking, LiveCoinWatch, and similar forms.
          </p>
          <div className="mt-6 grid gap-4">
            {supplyApis.map((api) => (
              <div key={api.path} className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{api.label}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{api.note}</div>
                  </div>
                  <a href={`${PUBLIC_API_URL}${api.path}`} target="_blank" rel="noopener noreferrer" className={`break-all font-mono text-sm ${externalLinkClass}`}>
                    {PUBLIC_API_URL}{api.path}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="reviewers" className={sectionClass}>
          <div className={eyebrowClass}>For listing reviewers</div>
          <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Canonical links and metadata</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300">
            Use these values verbatim. They match the token page on BaseScan and every listing submitted by the project.
          </p>
          <dl className="mt-6 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800 md:grid-cols-2">
            {reviewerLinks.map((item) => (
              <div key={item.label} className="bg-white p-4 dark:bg-slate-900/60">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</dt>
                <dd className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className={`mt-6 ${cardClass}`}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Supply methodology</div>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              Total supply equals the contract total supply minus the balance of the burn address. Circulating supply additionally excludes
              treasury-locked balances. Exchange custody wallets, including Biconomy, hold tokens on behalf of their users and are counted as
              circulating. Max supply equals the current total supply because the contract cannot mint.
            </p>
          </div>
        </section>

        <section className="border-t border-slate-200 py-12 dark:border-slate-800">
          <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
            Holder percentages and market descriptions were last reviewed on 2026-11-09 and are refreshed when listings or large balances
            change. Live figures come from the public APIs above. This page is informational and is not investment advice.
          </p>
        </section>
      </div>
    </main>
  );
}
