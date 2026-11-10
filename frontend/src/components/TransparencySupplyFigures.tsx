'use client';

import { useEffect, useState } from 'react';
import { parseJsonResponse } from '@/utils/apiErrors';
import { getApiBaseUrl } from '@/utils/apiBaseUrl';

type SupplyFigures = {
  totalSupply: number;
  circulatingSupply: number;
  burnedSupply: number;
};

type SupplyState =
  | { status: 'loading' }
  | { status: 'ready'; figures: SupplyFigures; fetchedAt: Date }
  | { status: 'error'; message: string };

const API_BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Live supply request timed out')), timeoutMs);
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

async function fetchSupplyFigures(): Promise<SupplyFigures> {
  const [totalResponse, circulatingResponse, burnedResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/supply`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/circulating`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/burned`, { cache: 'no-store' }),
  ]);
  const [total, circulating, burned] = await Promise.all([
    parseJsonResponse<number>(totalResponse, 'Failed to fetch total supply'),
    parseJsonResponse<number>(circulatingResponse, 'Failed to fetch circulating supply'),
    parseJsonResponse<number>(burnedResponse, 'Failed to fetch burned supply'),
  ]);
  const figures = { totalSupply: Number(total), circulatingSupply: Number(circulating), burnedSupply: Number(burned) };
  if (!Object.values(figures).every(Number.isFinite)) {
    throw new Error('Supply endpoints returned non-numeric values');
  }
  return figures;
}

function formatWhole(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatPercent(part: number, whole: number) {
  if (!whole) return 'n/a';
  return `${((part / whole) * 100).toFixed(2)}%`;
}

const figureCardClass = 'border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60';

export function TransparencySupplyFigures() {
  const [state, setState] = useState<SupplyState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    withTimeout(fetchSupplyFigures(), REQUEST_TIMEOUT_MS)
      .then((figures) => {
        if (!cancelled) setState({ status: 'ready', figures, fetchedAt: new Date() });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', message: error instanceof Error ? error.message : 'Live supply data unavailable' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="grid gap-4 md:grid-cols-3" aria-busy="true">
        {['Total supply', 'Circulating supply', 'Burned supply'].map((label) => (
          <div key={label} className={figureCardClass}>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</div>
            <div className="mt-3 h-7 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200" role="status">
        Live supply figures are temporarily unavailable ({state.message}). The API endpoints listed below remain the source of truth.
      </div>
    );
  }

  const { totalSupply, circulatingSupply, burnedSupply } = state.figures;
  const originalMint = totalSupply + burnedSupply;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className={figureCardClass}>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Total supply</div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatWhole(totalSupply)}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">EPWX, net of burned tokens</div>
        </div>
        <div className={figureCardClass}>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Circulating supply</div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatWhole(circulatingSupply)}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatPercent(circulatingSupply, totalSupply)} of total supply</div>
        </div>
        <div className={figureCardClass}>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Burned supply</div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatWhole(burnedSupply)}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatPercent(burnedSupply, originalMint)} of the original mint</div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Original mint: {formatWhole(originalMint)} EPWX. Block explorers and some indexers display this raw figure; the live total above
        already excludes the {formatWhole(burnedSupply)} EPWX sent to the burn address. Fetched {state.fetchedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC.
      </p>
    </div>
  );
}
