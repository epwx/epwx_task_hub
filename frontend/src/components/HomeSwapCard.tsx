'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useAccount, useBalance } from 'wagmi';
import { base } from 'wagmi/chains';

import {
  EPWX_DECIMALS,
  EPWX_SWAP_SLIPPAGE_PERCENT,
} from '@/utils/epwxMarket';
import { getEpwxSwapQuote, getEpwxToEthSwapQuote, swapEpwxToEth, swapEthToEpwx } from '@/utils/swapEthToEpwx';

const DEFAULT_SWAP_AMOUNT = '0.001';
const DEFAULT_SELL_AMOUNT = '1000000000';
const BASE_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org';
const MAX_GAS_BUFFER_ETH = 0.00005;
const MAX_GAS_BUFFER_WEI = ethers.parseEther(String(MAX_GAS_BUFFER_ETH));
const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || '0xef5f5751cf3eca6cc3572768298b7783d33d60eb';
const DEFAULT_DAILY_REWARD = 100_000;
const MID_TIER_DAILY_REWARD = 2_000_000;
const BONUS_DAILY_REWARD = 5_000_000;
const MEGA_DAILY_REWARD = 10_000_000;
const MID_TIER_DAILY_REWARD_THRESHOLD = 10_000_000_000;
const BONUS_DAILY_REWARD_THRESHOLD = 100_000_000_000;
const MEGA_DAILY_REWARD_THRESHOLD = 1_000_000_000_000;
const CASHBACK_THRESHOLD = 100_000_000_000;

function formatEpwxBalance(balance?: number) {
  const numericBalance = Number(balance || 0);

  if (!Number.isFinite(numericBalance) || numericBalance <= 0) {
    return '0';
  }

  if (numericBalance >= 1) {
    return numericBalance.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  return numericBalance.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function formatEthBalance(balance?: string) {
  const numericBalance = Number(balance || 0);

  if (!Number.isFinite(numericBalance) || numericBalance <= 0) {
    return '0';
  }

  if (numericBalance >= 1) {
    return numericBalance.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  return numericBalance.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatSwapOutput(value: string, symbol: 'ETH' | 'EPWX') {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: symbol === 'ETH' ? 8 : 4,
  });
}

type HomeSwapCardProps = {
  compact?: boolean;
};

type SwapDirection = 'buy' | 'sell';

export function HomeSwapCard({ compact = false }: HomeSwapCardProps) {
  const { address, connector } = useAccount();
  const { data: baseEthBalance } = useBalance({
    address,
    chainId: base.id,
  });
  const { data: epwxBalance } = useBalance({
    address,
    token: EPWX_TOKEN_ADDRESS,
    chainId: base.id,
  });
  const [direction, setDirection] = useState<SwapDirection>('buy');
  const [amount, setAmount] = useState(DEFAULT_SWAP_AMOUNT);
  const [quoteOut, setQuoteOut] = useState<string>('');
  const [minimumOut, setMinimumOut] = useState<string>('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const availableBaseEth = Number(baseEthBalance?.formatted || 0);
  const availableBaseEthWei = baseEthBalance?.value || BigInt(0);
  const maxSwapEthWei = availableBaseEthWei > MAX_GAS_BUFFER_WEI
    ? availableBaseEthWei - MAX_GAS_BUFFER_WEI
    : BigInt(0);
  const normalizedEpwxBalance = Number(epwxBalance?.formatted || 0);
  const inputBalanceWei = direction === 'buy' ? availableBaseEthWei : epwxBalance?.value || BigInt(0);
  const maxInputAmountWei = direction === 'buy' ? maxSwapEthWei : inputBalanceWei;
  const inputDecimals = direction === 'buy' ? 18 : EPWX_DECIMALS;
  let amountInWei: bigint | null = null;
  try {
    amountInWei = ethers.parseUnits(amount.trim(), inputDecimals);
  } catch {
    amountInWei = null;
  }
  const amountExceedsBalance = Boolean(direction === 'buy' ? baseEthBalance : epwxBalance) && (
    amountInWei === null || amountInWei > maxInputAmountWei
  );
  const inputSymbol = direction === 'buy' ? 'ETH' : 'EPWX';
  const outputSymbol = direction === 'buy' ? 'EPWX' : 'ETH';
  const currentDailyReward = normalizedEpwxBalance >= MEGA_DAILY_REWARD_THRESHOLD
    ? MEGA_DAILY_REWARD
    : normalizedEpwxBalance >= BONUS_DAILY_REWARD_THRESHOLD
      ? BONUS_DAILY_REWARD
      : normalizedEpwxBalance >= MID_TIER_DAILY_REWARD_THRESHOLD
        ? MID_TIER_DAILY_REWARD
        : DEFAULT_DAILY_REWARD;
  const nextTierTarget = normalizedEpwxBalance >= MEGA_DAILY_REWARD_THRESHOLD
    ? null
    : normalizedEpwxBalance >= BONUS_DAILY_REWARD_THRESHOLD
      ? MEGA_DAILY_REWARD_THRESHOLD
      : normalizedEpwxBalance >= MID_TIER_DAILY_REWARD_THRESHOLD
        ? BONUS_DAILY_REWARD_THRESHOLD
        : MID_TIER_DAILY_REWARD_THRESHOLD;
  const nextTierReward = nextTierTarget === MEGA_DAILY_REWARD_THRESHOLD
    ? MEGA_DAILY_REWARD
    : nextTierTarget === BONUS_DAILY_REWARD_THRESHOLD
      ? BONUS_DAILY_REWARD
      : nextTierTarget === MID_TIER_DAILY_REWARD_THRESHOLD
        ? MID_TIER_DAILY_REWARD
        : null;
  const tokensToNextTier = nextTierTarget === null
    ? 0
    : Math.max(nextTierTarget - normalizedEpwxBalance, 0);

  const setPercentAmount = (percent: number) => {
    if (inputBalanceWei <= BigInt(0)) {
      setAmount('0');
      setSelectedPreset(null);
      return;
    }

    const valueWei = percent === 100
      ? maxInputAmountWei
      : (inputBalanceWei * BigInt(percent)) / BigInt(100);
    setAmount(ethers.formatUnits(valueWei, inputDecimals));
    setSelectedPreset(percent === 100 ? 'max' : String(percent));
  };

  const selectDirection = (nextDirection: SwapDirection) => {
    setDirection(nextDirection);
    setAmount(nextDirection === 'buy' ? DEFAULT_SWAP_AMOUNT : DEFAULT_SELL_AMOUNT);
    setSelectedPreset(null);
    setStatus(null);
  };

  useEffect(() => {
    let cancelled = false;
    const normalizedInput = amount.trim();

    const loadQuote = async () => {
      if (!normalizedInput || Number(normalizedInput) <= 0) {
        setQuoteOut('');
        setMinimumOut('');
        setQuoteError(`Enter an ${inputSymbol} amount greater than 0`);
        return;
      }

      if (amountExceedsBalance) {
        setQuoteOut('');
        setMinimumOut('');
        setQuoteError(`Enter ${ethers.formatUnits(maxInputAmountWei, inputDecimals)} ${inputSymbol} or less${direction === 'buy' ? ' to keep enough ETH for Base gas' : ''}.`);
        return;
      }

      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
        const quote = direction === 'buy'
          ? await getEpwxSwapQuote({ provider, amountEth: normalizedInput })
          : await getEpwxToEthSwapQuote({ provider, amountEpwx: normalizedInput });

        if (!cancelled) {
          setQuoteOut(quote.quotedOutFormatted);
          setMinimumOut(quote.minOutFormatted);
        }
      } catch (error) {
        if (!cancelled) {
          setQuoteOut('');
          setMinimumOut('');
          setQuoteError(error instanceof Error ? error.message : `Unable to load ${outputSymbol} quote`);
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
  }, [amount, amountExceedsBalance, direction, inputDecimals, inputSymbol, maxInputAmountWei, outputSymbol]);

  const handleSwap = async () => {
    setStatus(null);

    if (amountExceedsBalance) {
      setStatus(`Enter ${ethers.formatUnits(maxInputAmountWei, inputDecimals)} ${inputSymbol} or less${direction === 'buy' ? ' to keep enough ETH for Base gas' : ''}.`);
      return;
    }

    try {
      setSwapLoading(true);
      const connectorProvider = connector ? await connector.getProvider() : null;
      const injectedProvider = typeof window !== 'undefined' ? window.ethereum : null;
      const activeProvider = connectorProvider || injectedProvider;

      if (!activeProvider) {
        throw new Error('No compatible wallet provider found. Reconnect your Base wallet and try again.');
      }

      const provider = new ethers.BrowserProvider(activeProvider);

      try {
        await provider.send('wallet_switchEthereumChain', [{ chainId: '0x2105' }]);
      } catch {
        // Continue and let wallet/provider handle chain mismatch if auto-switch is unsupported.
      }

      const accounts = await provider.send('eth_requestAccounts', []);
      const userAddress = accounts[0] || address;

      if (!userAddress) {
        throw new Error('Connect your wallet before swapping');
      }

      const txHash = direction === 'buy'
        ? await swapEthToEpwx({ provider, amountEth: amount.trim(), userAddress })
        : await swapEpwxToEth({ provider, amountEpwx: amount.trim(), userAddress });

      setStatus(`Swap submitted successfully: ${txHash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl ${compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'}`}>
      <div className={`absolute left-0 top-0 rounded-full bg-cyan-300/10 blur-3xl ${compact ? 'h-32 w-32' : 'h-48 w-48'}`} />
      <div className={`absolute bottom-0 right-0 rounded-full bg-emerald-300/10 blur-3xl ${compact ? 'h-40 w-40' : 'h-56 w-56'}`} />

      <div className="relative z-10">
        <div>
          <p className={`font-semibold uppercase text-white/70 ${compact ? 'text-xs tracking-[0.2em]' : 'text-sm tracking-[0.3em]'}`}>Base Swap</p>
          {compact ? (
            <h2 className="mt-2 text-2xl font-black text-white">Swap ETH to EPWX</h2>
          ) : (
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{direction === 'buy' ? 'Buy EPWX' : 'Sell EPWX'}</h1>
          )}
          <p className={`mt-2 text-white/75 ${compact ? 'text-xs leading-6' : 'text-sm leading-6'}`}>
            {direction === 'buy'
              ? 'Swap ETH on Base and receive EPWX directly in your wallet.'
              : 'Swap EPWX on Base and receive ETH directly in your wallet.'}
          </p>
        </div>

        {!compact ? (
          <div className="mt-5 grid grid-cols-2 rounded-xl border border-white/15 bg-slate-950/40 p-1" aria-label="Swap direction">
            <button
              type="button"
              aria-pressed={direction === 'buy'}
              onClick={() => selectDirection('buy')}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${direction === 'buy' ? 'bg-emerald-500 text-slate-950' : 'text-white/65 hover:text-white'}`}
            >
              Buy EPWX
            </button>
            <button
              type="button"
              aria-pressed={direction === 'sell'}
              onClick={() => selectDirection('sell')}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${direction === 'sell' ? 'bg-cyan-400 text-slate-950' : 'text-white/65 hover:text-white'}`}
            >
              Sell EPWX
            </button>
          </div>
        ) : null}

        {compact ? <div className="mt-5 grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-lg">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Current daily tier</div>
            <div className="mt-2 text-2xl font-black text-white">{currentDailyReward.toLocaleString()} EPWX</div>
            <div className="mt-1 text-sm text-white/75">Current wallet balance: {formatEpwxBalance(normalizedEpwxBalance)} EPWX</div>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-lg">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Next unlock</div>
            {nextTierTarget && nextTierReward ? (
              <>
                <div className="mt-2 text-2xl font-black text-emerald-100">{nextTierReward.toLocaleString()} EPWX</div>
                <div className="mt-1 text-sm text-white/75">Buy or hold {formatEpwxBalance(tokensToNextTier)} more EPWX to reach {nextTierTarget.toLocaleString()}.</div>
              </>
            ) : (
              <>
                <div className="mt-2 text-2xl font-black text-emerald-100">Top tier active</div>
                <div className="mt-1 text-sm text-white/75">This wallet already qualifies for the maximum daily claim reward.</div>
              </>
            )}
          </div>
        </div> : null}

        {compact ? <div className="mt-5 flex w-full flex-col gap-3">
          <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-lg">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">From</div>
            <div className="mt-1 text-xl font-black text-white">ETH</div>
            <div className="text-sm text-white/70">Base network</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center self-center rounded-full border border-white/20 bg-white/10 text-lg text-white backdrop-blur-lg">
            ↓
          </div>
          <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-lg">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">To</div>
            <div className="mt-1 text-xl font-black text-white">EPWX</div>
            <div className="text-sm text-white/70">Received in wallet</div>
          </div>
        </div> : null}

        <div className="mt-5">
          <div className={`w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg ${compact ? 'p-4' : 'p-6'}`}>
            <label className="block text-sm font-semibold text-white/80" htmlFor="home-epwx-swap-amount">
              {inputSymbol} amount on Base
            </label>
            <div className="mt-2 flex flex-col gap-2 text-sm text-white/75 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Available {inputSymbol}: <span className="font-semibold text-white">{direction === 'buy' ? formatEthBalance(baseEthBalance?.formatted) : formatEpwxBalance(normalizedEpwxBalance)}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 75].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setPercentAmount(percent)}
                    disabled={inputBalanceWei <= BigInt(0)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${selectedPreset === String(percent)
                      ? 'border-emerald-200 bg-emerald-400/20 text-white'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {percent}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPercentAmount(100)}
                  disabled={inputBalanceWei <= BigInt(0)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${selectedPreset === 'max'
                    ? 'border-emerald-200 bg-emerald-400/20 text-white'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
                >
                  Max
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <input
                id="home-epwx-swap-amount"
                type="number"
                min="0"
                max={maxInputAmountWei > BigInt(0) ? ethers.formatUnits(maxInputAmountWei, inputDecimals) : undefined}
                step={direction === 'buy' ? '0.0001' : '1'}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/35"
                placeholder={direction === 'buy' ? DEFAULT_SWAP_AMOUNT : DEFAULT_SELL_AMOUNT}
              />
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">{inputSymbol}</span>
            </div>
            <p className="mt-2 text-xs text-white/65">
              {direction === 'buy' ? 'Max keeps a small amount of ETH available for Base network gas.' : 'Keep a small amount of ETH in your wallet for Base network gas.'}
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Estimated {outputSymbol}</p>
              <p className="mt-2 break-all text-lg font-black tabular-nums text-white sm:text-2xl">
                {quoteLoading ? 'Loading...' : quoteOut ? formatSwapOutput(quoteOut, outputSymbol) : '--'}
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
              disabled={swapLoading || quoteLoading || !quoteOut || !!quoteError || !(direction === 'buy' ? baseEthBalance : epwxBalance) || amountExceedsBalance}
              className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-base font-bold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50 ${direction === 'buy' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-cyan-400 hover:bg-cyan-300'}`}
            >
              {swapLoading ? 'Submitting swap...' : `Swap ${inputSymbol} for ${outputSymbol}`}
            </button>

            <p className="mt-3 text-xs text-white/70">
              {address
                ? `Your connected wallet will receive ${outputSymbol} directly on Base after you confirm the swap.`
                : 'Connect your wallet first, then review and approve the swap transaction in your wallet.'}
            </p>

            <details className="mt-4 border-t border-white/10 pt-4 text-sm text-white/75">
              <summary className="cursor-pointer font-semibold text-white">Transaction details</summary>
              <div className="mt-3 space-y-2 leading-6">
                <p>Price protection includes a {EPWX_SWAP_SLIPPAGE_PERCENT}% movement allowance. The swap will fail if the rate moves beyond it.</p>
                <p>{direction === 'buy' ? 'Your wallet will confirm one Base transaction for the ETH amount shown plus the network gas fee. No EPWX token approval is required.' : 'If needed, your wallet will first ask you to approve the exact EPWX amount, then confirm the swap. Both transactions require Base network gas.'}</p>
                {minimumOut ? <p>Minimum received: {formatSwapOutput(minimumOut, outputSymbol)} {outputSymbol}.</p> : null}
              </div>
            </details>

            {status && (
              <div className="mt-4 rounded-2xl border border-white/15 bg-slate-950/20 p-4 text-sm text-white/85 break-all">
                {status}
              </div>
            )}
          </div>
        </div>

        {!compact ? (
          <section className="mt-5 border-t border-white/10 pt-5" aria-labelledby="swap-rewards-heading">
            <div className="flex items-center justify-between gap-4">
              <h2 id="swap-rewards-heading" className="text-sm font-bold text-white">Your EPWX rewards</h2>
              <Link href="/cashback" className="text-xs font-semibold text-emerald-200 hover:text-white">Cashback details</Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/55">Daily reward</p>
                <p className="mt-1 font-bold text-white">{currentDailyReward.toLocaleString()} EPWX</p>
              </div>
              <div>
                <p className="text-white/55">Next tier</p>
                <p className="mt-1 font-bold text-white">{nextTierReward ? `${nextTierReward.toLocaleString()} EPWX` : 'Top tier active'}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/60">
              {nextTierTarget ? `${formatEpwxBalance(tokensToNextTier)} more EPWX reaches the next tier.` : 'This wallet qualifies for the maximum daily reward.'} Purchases of {CASHBACK_THRESHOLD.toLocaleString()} EPWX or more may qualify for cashback.
              {direction === 'sell' ? ' Selling EPWX may lower your daily reward tier.' : ''}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}