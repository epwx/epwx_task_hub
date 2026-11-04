'use client';

import { useEffect, useMemo, useState } from 'react';
import { parseJsonResponse } from '@/utils/apiErrors';
import { getApiBaseUrl } from '@/utils/apiBaseUrl';
import { WhitepaperAddress } from '@/components/WhitepaperAddress';
import {
  EPWX_TOKEN_ADDRESS,
  EPWX_WETH_PAIR_ADDRESS,
  PANCAKESWAP_ROUTER_ADDRESS,
  WETH_TOKEN_ADDRESS,
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

const API_BASE_URL = getApiBaseUrl();
const BASESCAN_ADDRESS_URL = 'https://basescan.org/address/';
const REQUEST_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Live data request timed out')), timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

async function fetchSupplySnapshot(): Promise<SupplySnapshot> {
  const [totalResponse, circulatingResponse, burnedResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/supply`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/circulating`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/burned`, { cache: 'no-store' }),
  ]);

  const [totalPayload, circulatingPayload, burnedPayload] = await Promise.all([
    parseJsonResponse<number>(totalResponse, 'Failed to fetch total supply'),
    parseJsonResponse<number>(circulatingResponse, 'Failed to fetch circulating supply'),
    parseJsonResponse<number>(burnedResponse, 'Failed to fetch burned supply'),
  ]);

  return {
    totalSupply: String(totalPayload || 0),
    circulatingSupply: String(circulatingPayload || 0),
    burnedSupply: String(burnedPayload || 0),
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

const statCardClass = 'border-b border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50';

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
      const [priceResult, supplyResult] = await Promise.allSettled([
        withTimeout(fetchEpwxPriceData(), REQUEST_TIMEOUT_MS),
        withTimeout(fetchSupplySnapshot(), REQUEST_TIMEOUT_MS),
      ]);

      if (cancelled) {
        return;
      }

      const priceData = priceResult.status === 'fulfilled' ? priceResult.value : null;
      const supplyData = supplyResult.status === 'fulfilled' ? supplyResult.value : null;
      const failedRequests = Number(!priceData) + Number(!supplyData);

      setState({
        priceData,
        supplyData,
        lastUpdated: priceData || supplyData ? new Date() : null,
        error: failedRequests === 0
          ? null
          : failedRequests === 2
            ? 'Live metrics are temporarily unavailable. Deployment details below remain current.'
            : 'Some live metrics are temporarily unavailable. Available values are shown below.',
        loading: false,
      });
    };

    loadSnapshot();
    const interval = window.setInterval(loadSnapshot, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    const priceStats = state.priceData ? [
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
    ] : [];
    const supplyStats = state.supplyData ? [
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
    ] : [];

    return [...priceStats, ...supplyStats];
  }, [state.priceData, state.supplyData]);

  return (
    <section id="token-snapshot" className="scroll-mt-24 py-12 md:py-16">
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-sky-600 dark:text-sky-400">01</span>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">Live token snapshot</div>
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">EPWX at a glance</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Live market data and on-chain supply reporting provide a current reference for listings, partners, and community research.
            </p>
          </div>
          <div className="shrink-0 border-l border-sky-500 pl-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            {state.lastUpdated ? `Updated ${state.lastUpdated.toLocaleTimeString()}` : state.loading ? 'Updating live data' : 'Static details available'}
          </div>
        </div>

        {state.error ? (
          <div className="mt-7 border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200" role="status">
            {state.error}
          </div>
        ) : null}

        {state.loading || stats.length > 0 ? (
          <div className="mt-8 grid border-l border-t border-slate-200 sm:grid-cols-2 xl:grid-cols-3 dark:border-slate-800">
            {(state.loading ? new Array(6).fill(null) : stats).map((stat, index) => (
              <div key={stat ? stat.label : index} className={statCardClass}>
                {stat ? (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{stat.label}</div>
                    <div className="mt-3 break-words text-xl font-bold text-slate-950 dark:text-white md:text-2xl">{stat.value}</div>
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
        ) : null}

        <div className="mt-8 grid border-l border-t border-slate-200 lg:grid-cols-3 dark:border-slate-800">
          <div className={statCardClass}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Network</div>
            <div className="mt-3 text-lg font-bold text-slate-950 dark:text-white">Base</div>
            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Utility, rewards, and market activity are tracked against the Base deployment.</div>
          </div>
          <div className={statCardClass}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Token Contract</div>
            <div className="mt-3">
              <WhitepaperAddress address={EPWX_TOKEN_ADDRESS} href={`${BASESCAN_ADDRESS_URL}${EPWX_TOKEN_ADDRESS}`} />
            </div>
          </div>
          <div className={statCardClass}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Trading Infrastructure</div>
            <div className="mt-3 space-y-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
              <div>
                <span className="mb-1 block font-semibold text-slate-950 dark:text-white">WETH</span>
                <WhitepaperAddress address={WETH_TOKEN_ADDRESS} href={`${BASESCAN_ADDRESS_URL}${WETH_TOKEN_ADDRESS}`} compact />
              </div>
              <div>
                <span className="mb-1 block font-semibold text-slate-950 dark:text-white">Pair</span>
                <WhitepaperAddress address={EPWX_WETH_PAIR_ADDRESS} href={`${BASESCAN_ADDRESS_URL}${EPWX_WETH_PAIR_ADDRESS}`} compact />
              </div>
              <div>
                <span className="mb-1 block font-semibold text-slate-950 dark:text-white">Router</span>
                <WhitepaperAddress address={PANCAKESWAP_ROUTER_ADDRESS} href={`${BASESCAN_ADDRESS_URL}${PANCAKESWAP_ROUTER_ADDRESS}`} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}