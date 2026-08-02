'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { base } from 'wagmi/chains';
import {
  EPWX_TOKEN_ADDRESS,
  WETH_TOKEN_ADDRESS,
  EPWX_WETH_PAIR_ADDRESS,
  PANCAKESWAP_ROUTER_ADDRESS,
  fetchEpwxPriceData,
  formatEpwxBalance,
  type EpwxPriceData,
} from '@/utils/epwxMarket';

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function EPWXStats() {
  const [priceData, setPriceData] = useState<EpwxPriceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Wallet connection
  const { address, isConnected } = useAccount();
  const {
    data: epwxBalance,
    isLoading: balanceLoading,
    error: balanceError
  } = useBalance({
    address,
    token: EPWX_TOKEN_ADDRESS,
    chainId: base.id,
  });

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, REFRESH_INTERVAL_MS); // Update every 24 hours
    return () => clearInterval(interval);
  }, []);

  const fetchPrice = async () => {
    try {
      setPriceData(await fetchEpwxPriceData());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch price:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>
        <div className="relative z-10 animate-pulse">
          <div className="h-7 w-1/3 rounded-lg bg-white/15"></div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-lg">
                <div className="h-4 w-2/3 rounded bg-white/10"></div>
                <div className="mt-3 h-8 w-full rounded bg-white/15"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!priceData) return null;

  // Format price to show exact value with subscript notation for leading zeros
  const formatPrice = (price: number) => {
    if (price === 0) return '$0';
    
    // For very small numbers, show with subscript notation
    if (price < 0.000001) {
      // Convert to string with enough precision
      const priceStr = price.toFixed(20);
      const match = priceStr.match(/^0\.(0*)([1-9]\d*)/);
      if (match) {
        const leadingZeros = match[1].length;
        const significantDigits = match[2].slice(0, 4); // Show 4 significant digits
        
        if (leadingZeros > 0) {
          // Use subscript Unicode characters for the number
          const subscriptMap: { [key: string]: string } = {
            '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
            '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
          };
          const subscriptCount = leadingZeros.toString().split('').map(d => subscriptMap[d]).join('');
          return `$0.0${subscriptCount}${significantDigits}`;
        }
        return `$0.${significantDigits}`;
      }
    }
    return `$${price.toFixed(12)}`;
  };

  // Format wallet balance
  let formattedBalance = '';
  if (isConnected && epwxBalance) {
    try {
      formattedBalance = formatEpwxBalance(Number(epwxBalance.formatted));
    } catch {
      formattedBalance = '';
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-2 backdrop-blur">
            <svg className="h-6 w-6 text-cyan-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-3xl font-black text-white">EPWX Token Stats</h3>
        </div>

        {/* Wallet Balance (if connected) */}
        {isConnected && (
          <div className="mb-6 flex w-fit items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-lg">
            <span className="font-semibold text-slate-200">Your EPWX Balance:</span>
            {balanceLoading ? (
              <span className="animate-pulse text-slate-400">Loading...</span>
            ) : balanceError ? (
              <span className="text-rose-300">Error</span>
            ) : (
              <span className="font-bold text-emerald-200">{formattedBalance}</span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Price Card */}
          <div className="group relative rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-lg transition-colors hover:bg-white/[0.08]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current Price</p>
            <p className="mb-1 break-all text-3xl font-black text-white">{formatPrice(priceData.priceUSD)}</p>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>Live</span>
            </div>
          </div>

          {/* Market Cap Card */}
          <div className="group relative rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-lg transition-colors hover:bg-white/[0.08]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Market Cap</p>
            <p className="mb-1 text-3xl font-black text-white">
              ${(priceData.marketCap).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-400">Total Value</p>
          </div>

          {/* Liquidity Card */}
          <div className="group relative rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-lg transition-colors hover:bg-white/[0.08]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">DEX Liquidity</p>
            <p className="mb-1 text-3xl font-black text-white">
              ${priceData.liquidityUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-400">Pool Depth</p>
          </div>

          {/* DEX Info Card */}
          <div className="group relative rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-lg transition-colors hover:bg-white/[0.08]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Trading On</p>
            <p className="mb-1 text-2xl font-black text-white">PancakeSwap</p>
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-xs font-semibold text-slate-300">Base Network</p>
              <Link
                href="/#buy-epwx"
                className="flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200 group-hover:underline"
              >
                Trade Now →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6 backdrop-blur-lg">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">EPWX / WETH Pair Details</p>
            <div className="space-y-4 text-sm text-slate-200">
              <div>
                <p className="mb-1 text-slate-400">EPWX token</p>
                <p className="font-mono break-all text-white">{EPWX_TOKEN_ADDRESS}</p>
              </div>
              <div>
                <p className="mb-1 text-slate-400">WETH token</p>
                <p className="font-mono break-all text-white">{WETH_TOKEN_ADDRESS}</p>
              </div>
              <div>
                <p className="mb-1 text-slate-400">Pair contract</p>
                <p className="font-mono break-all text-white">{EPWX_WETH_PAIR_ADDRESS}</p>
              </div>
              <div>
                <p className="mb-1 text-slate-400">Router</p>
                <p className="font-mono break-all text-white">{PANCAKESWAP_ROUTER_ADDRESS}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Last updated indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></div>
          <span className="font-medium">Updates every 24 hours</span>
        </div>
      </div>
    </section>
  );
}
