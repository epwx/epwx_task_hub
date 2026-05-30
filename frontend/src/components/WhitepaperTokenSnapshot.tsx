'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  EPWX_TOKEN_ADDRESS,
  EPWX_USDT_PAIR_ADDRESS,
  PANCAKESWAP_ROUTER_ADDRESS,
  fetchEpwxPriceData,
  type EpwxPriceData,
} from '@/utils/epwxMarket';

type SupplySnapshot = {
  totalSupply: string;
  circulatingSupply: string;
  burnedSupply: string;
};

type SnapshotState = {
  priceData: EpwxPriceData | null;
  supplyData: SupplySnapshot | null;
  lastUpdated: Date | null;
  error: string | null;
  loading: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.epowex.com';

async function fetchSupplySnapshot(): Promise<SupplySnapshot> {
  const [totalResponse, circulatingResponse, burnedResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/supply`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/circulating`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/burned`, { cache: 'no-store' }),
  ]);

  const [totalPayload, circulatingPayload, burnedPayload] = await Promise.all([
    totalResponse.json(),
    circulatingResponse.json(),
    burnedResponse.json(),
  ]);

  if (!totalResponse.ok) {
    throw new Error(totalPayload?.error || 'Failed to fetch total supply');
  }

  if (!circulatingResponse.ok) {
    throw new Error(circulatingPayload?.error || 'Failed to fetch circulating supply');
  }

  if (!burnedResponse.ok) {
    throw new Error(burnedPayload?.error || 'Failed to fetch burned supply');
  }

  return {
    totalSupply: String(totalPayload.totalSupply || '0'),
    circulatingSupply: String(circulatingPayload.circulatingSupply || '0'),
    burnedSupply: String(burnedPayload.burnedSupply || '0'),
  };
}

function formatCurrency(value: number, digits = 6) {
  if (!Number.isFinite(value)) return 'N/A';
  if (value >= 1) {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return `$${value.toFixed(digits)}`;
}

function formatLargeNumber(value: number) {
  if (!Number.isFinite(value)) return 'N/A';
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatSupply(value: string) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  return numericValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

const statCardClass = 'rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800/70';

export function WhitepaperTokenSnapshot() {
  const [state, setState] = useState<SnapshotState>({
    priceData: null,
    supplyData: null,
    lastUpdated: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = async () => {
      try {
        const [priceData, supplyData] = await Promise.all([
          fetchEpwxPriceData(),
          fetchSupplySnapshot(),
        ]);

        if (cancelled) {
          return;
        }

        setState({
          priceData,
          supplyData,
          lastUpdated: new Date(),
          error: null,
          loading: false,
        });
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        setState((current) => ({
          ...current,
          error: error?.message || 'Failed to load token snapshot',
          loading: false,
        }));
      }
    };

    loadSnapshot();
    const interval = window.setInterval(loadSnapshot, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    if (!state.priceData || !state.supplyData) {
      return [];
    }

    return [
      {
        label: 'Current Price',
        value: formatCurrency(state.priceData.priceUSD, 12),
        caption: 'Live market price',
      },
      {
        label: 'Market Cap',
        value: formatCurrency(state.priceData.marketCap, 2),
        caption: 'Based on live price',
      },
      {
        label: 'DEX Liquidity',
        value: formatCurrency(state.priceData.liquidityUSD, 2),
        caption: 'Current pool depth',
      },
      {
        label: 'Circulating Supply',
        value: formatLargeNumber(Number(state.supplyData.circulatingSupply)),
        caption: 'Excludes burned and treasury-locked balances',
      },
      {
        label: 'Total Supply',
        value: formatSupply(state.supplyData.totalSupply),
        caption: 'Reported by token contract',
      },
      {
        label: 'Burned Supply',
        value: formatSupply(state.supplyData.burnedSupply),
        caption: 'Sent to dead address',
      },
    ];
  }, [state.priceData, state.supplyData]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-300">Live token snapshot</div>
            <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Real-time EPWX token data</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              This section combines live market data with on-chain supply reporting so the public whitepaper page can act as a current reference for listings, partners, and community research.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            {state.lastUpdated ? `Updated ${state.lastUpdated.toLocaleTimeString()}` : 'Updating live data'}
          </div>
        </div>

        {state.error ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {state.error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(state.loading ? new Array(6).fill(null) : stats).map((stat, index) => (
            <div key={stat ? stat.label : index} className={statCardClass}>
              {stat ? (
                <>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{stat.label}</div>
                  <div className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{stat.value}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{stat.caption}</div>
                </>
              ) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-8 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-44 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className={statCardClass}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Network</div>
            <div className="mt-3 text-lg font-black text-slate-950 dark:text-white">Base</div>
            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Utility, rewards, and market activity are tracked against the Base deployment.</div>
          </div>
          <div className={statCardClass}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Token Contract</div>
            <div className="mt-3 break-all text-sm font-semibold text-slate-950 dark:text-white">{EPWX_TOKEN_ADDRESS}</div>
          </div>
          <div className={statCardClass}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Trading Infrastructure</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <span className="font-semibold text-slate-950 dark:text-white">Pair:</span>{' '}
                <span className="break-all">{EPWX_USDT_PAIR_ADDRESS}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-950 dark:text-white">Router:</span>{' '}
                <span className="break-all">{PANCAKESWAP_ROUTER_ADDRESS}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}