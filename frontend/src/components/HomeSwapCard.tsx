'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';

import {
  EPWX_SWAP_SLIPPAGE_PERCENT,
} from '@/utils/epwxMarket';
import { getEpwxSwapQuote, swapEthToEpwx } from '@/utils/swapEthToEpwx';

const DEFAULT_SWAP_AMOUNT = '0.001';
const BASE_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org';

export function HomeSwapCard() {
  const { address } = useAccount();
  const [amountEth, setAmountEth] = useState(DEFAULT_SWAP_AMOUNT);
  const [quoteOut, setQuoteOut] = useState<string>('');
  const [minimumOut, setMinimumOut] = useState<string>('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const normalizedAmount = amountEth.trim();

    const loadQuote = async () => {
      if (!normalizedAmount || Number(normalizedAmount) <= 0) {
        setQuoteOut('');
        setMinimumOut('');
        setQuoteError('Enter an ETH amount greater than 0');
        return;
      }

      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
        const quote = await getEpwxSwapQuote({
          provider,
          amountEth: normalizedAmount,
        });

        if (!cancelled) {
          setQuoteOut(quote.quotedOutFormatted);
          setMinimumOut(quote.minOutFormatted);
        }
      } catch (error) {
        if (!cancelled) {
          setQuoteOut('');
          setMinimumOut('');
          setQuoteError(error instanceof Error ? error.message : 'Unable to load EPWX quote');
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    };

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [amountEth]);

  const handleSwap = async () => {
    setStatus(null);

    try {
      if (!window.ethereum) {
        throw new Error('A wallet with Base support is required to swap');
      }

      setSwapLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const userAddress = accounts[0] || address;

      if (!userAddress) {
        throw new Error('Connect your wallet before swapping');
      }

      const txHash = await swapEthToEpwx({
        provider,
        amountEth: amountEth.trim(),
        userAddress,
      });

      setStatus(`Swap submitted successfully: ${txHash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-700 via-cyan-700 to-emerald-700 p-8 shadow-2xl">
      <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100/80">Base Swap</p>
            <h2 className="mt-2 text-3xl font-black text-white">Swap ETH to EPWX</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              This swap uses the same EPWX token, pair, router, and market feed surfaced on the platform stats page.
            </p>
          </div>
          <Link href="/platform-stats" className="text-sm font-semibold text-emerald-100 underline-offset-4 hover:underline">
            View full platform stats
          </Link>
        </div>

        <div className="mt-6">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg max-w-3xl">
            <label className="block text-sm font-semibold text-white/80" htmlFor="home-epwx-swap-amount">
              ETH amount on Base
            </label>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/20 px-4 py-3">
              <input
                id="home-epwx-swap-amount"
                type="number"
                min="0"
                step="0.0001"
                value={amountEth}
                onChange={(event) => setAmountEth(event.target.value)}
                className="w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/35"
                placeholder="0.001"
              />
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">ETH</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Estimated EPWX</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {quoteLoading ? 'Loading...' : quoteOut ? Number(quoteOut).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '--'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Minimum Received</p>
                <p className="mt-2 text-2xl font-black text-emerald-200">
                  {quoteLoading ? 'Loading...' : minimumOut ? Number(minimumOut).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '--'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
              <p className="font-semibold">Price protection enabled</p>
              <p className="mt-1 text-emerald-100/80">
                If the rate moves too much before confirmation, the swap will not go through. The protected minimum shown above includes a {EPWX_SWAP_SLIPPAGE_PERCENT}% price movement allowance.
              </p>
            </div>

            {quoteError && (
              <div className="mt-4 rounded-2xl border border-red-200/20 bg-red-400/10 p-4 text-sm text-red-100">
                {quoteError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSwap}
              disabled={swapLoading || quoteLoading || !quoteOut || !!quoteError}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-base font-bold text-sky-800 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {swapLoading ? 'Submitting swap...' : `Swap ${amountEth || '0'} ETH for EPWX`}
            </button>

            <p className="mt-3 text-xs text-white/70">
              {address ? 'Your connected wallet will receive EPWX directly on Base.' : 'Connect your wallet above, then confirm the swap in your wallet.'}
            </p>

            {status && (
              <div className="mt-4 rounded-2xl border border-white/15 bg-slate-950/20 p-4 text-sm text-white/85 break-all">
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}