'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useBalance } from 'wagmi';
import { base } from 'wagmi/chains';

import {
  EPWX_SWAP_SLIPPAGE_PERCENT,
} from '@/utils/epwxMarket';
import { getEpwxSwapQuote, swapEthToEpwx } from '@/utils/swapEthToEpwx';

const DEFAULT_SWAP_AMOUNT = '0.001';
const BASE_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org';
const MAX_GAS_BUFFER_ETH = 0.00005;
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

function formatAmountInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  return value.toFixed(6).replace(/\.?0+$/, '');
}

type HomeSwapCardProps = {
  compact?: boolean;
};

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
  const [amountEth, setAmountEth] = useState(DEFAULT_SWAP_AMOUNT);
  const [quoteOut, setQuoteOut] = useState<string>('');
  const [minimumOut, setMinimumOut] = useState<string>('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const availableBaseEth = Number(baseEthBalance?.formatted || 0);
  const maxSwapEth = Math.max(0, availableBaseEth - MAX_GAS_BUFFER_ETH);
  const normalizedEpwxBalance = Number(epwxBalance?.formatted || 0);
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
    if (!availableBaseEth || availableBaseEth <= 0) {
      setAmountEth('0');
      setSelectedPreset(null);
      return;
    }

    const value = percent === 100 ? maxSwapEth : availableBaseEth * percent;
    setAmountEth(formatAmountInput(value));
    setSelectedPreset(percent === 100 ? 'max' : String(percent));
  };

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
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-2xl ${compact ? 'p-4 sm:p-5' : 'p-8'}`}>
      <div className={`absolute left-0 top-0 rounded-full bg-white/10 blur-3xl ${compact ? 'h-32 w-32' : 'h-48 w-48'}`} />
      <div className={`absolute bottom-0 right-0 rounded-full bg-white/10 blur-3xl ${compact ? 'h-40 w-40' : 'h-56 w-56'}`} />

      <div className="relative z-10">
        <div>
          <p className={`font-semibold uppercase text-white/70 ${compact ? 'text-xs tracking-[0.2em]' : 'text-sm tracking-[0.3em]'}`}>Base Swap</p>
          <h2 className={`mt-2 font-black text-white ${compact ? 'text-2xl' : 'text-3xl'}`}>Swap ETH to EPWX</h2>
          <p className={`mt-3 max-w-2xl text-white/80 ${compact ? 'text-xs leading-6' : 'text-sm leading-7'}`}>
            Buying EPWX does more than add tokens to your wallet. It can upgrade your daily claim tier immediately and purchases above {CASHBACK_THRESHOLD.toLocaleString()} EPWX within 3 hours can unlock cashback.
          </p>
        </div>

        <div className={`mt-5 grid gap-3 ${compact ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
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
          {!compact ? (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-lg">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Buyer cashback</div>
              <div className="mt-2 text-2xl font-black text-white">100B+ EPWX buy</div>
              <div className="mt-1 text-sm text-white/75">Qualifying purchases in the last 3 hours can be claimed in the cashback section.</div>
              <a href="#cashback-rewards" className="mt-3 inline-flex text-sm font-semibold text-emerald-100 underline underline-offset-4 hover:text-white">Jump to cashback rewards</a>
            </div>
          ) : null}
        </div>

        <div className={`mt-5 flex w-full flex-col gap-3 ${compact ? '' : 'sm:flex-row sm:items-center'}`}>
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
        </div>

        <div className="mt-6">
          <div className={`w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg ${compact ? 'p-4' : 'p-6'}`}>
            <label className="block text-sm font-semibold text-white/80" htmlFor="home-epwx-swap-amount">
              ETH amount on Base
            </label>
            <div className="mt-2 flex flex-col gap-2 text-sm text-white/75 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Available Base ETH: <span className="font-semibold text-white">{formatEthBalance(baseEthBalance?.formatted)}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 75].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setPercentAmount(percent / 100)}
                    disabled={!availableBaseEth}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${selectedPreset === String(percent / 100)
                      ? 'border-emerald-200 bg-emerald-400/20 text-white'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {percent}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPercentAmount(100)}
                  disabled={!availableBaseEth}
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
                step="0.0001"
                value={amountEth}
                onChange={(event) => {
                  setAmountEth(event.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/35"
                placeholder="0.001"
              />
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">ETH</span>
            </div>
            <p className="mt-2 text-xs text-white/65">Max keeps a small amount of ETH available for Base network gas.</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Estimated EPWX</p>
              <p className="mt-2 text-2xl font-black text-white">
                {quoteLoading ? 'Loading...' : quoteOut ? Number(quoteOut).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '--'}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
              <p className="font-semibold">Price protection enabled</p>
              <p className="mt-1 text-emerald-100/80">
                If the rate moves too much before confirmation, the swap will not go through. Your protected minimum still includes a {EPWX_SWAP_SLIPPAGE_PERCENT}% price movement allowance.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/80">
              <p className="font-semibold text-white">What your wallet will ask you to do</p>
              <p className="mt-2">
                Connecting identifies the wallet that should receive EPWX. Confirming the swap is a separate on-chain transaction that spends the ETH amount shown plus normal Base gas fees.
              </p>
              <p className="mt-2 text-white/70">
                This flow does not ask for an EPWX token approval because you are swapping from Base ETH.
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
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-green-600 px-5 py-3 text-base font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {swapLoading ? 'Submitting swap...' : `Swap ${amountEth || '0'} ETH for EPWX`}
            </button>

            <p className="mt-3 text-xs text-white/70">
              {address ? 'Your connected wallet will receive EPWX directly on Base after you approve the swap transaction.' : 'Connect your wallet first, then review and approve the swap transaction in your wallet.'}
            </p>
            <p className="mt-2 text-xs text-emerald-100/80">
              After your swap settles, return to the daily claim card to see your upgraded reward tier. If your purchase crosses 100,000,000,000 EPWX, check cashback right away.
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