'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'ethers';

interface PriceData {
  priceUSD: number;
  liquidityUSD: number;
  marketCap: number;
  epwxReserve: number;
  wethReserve: number;
}

const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || '0xef5f5751cf3eca6cc3572768298b7783d33d60eb';
const USDT_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_USDT_TOKEN as `0x${string}`) || '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2';
const EPWX_USDT_PAIR_ADDRESS = process.env.NEXT_PUBLIC_EPWX_USDT_PAIR || 'Not configured';
const PANCAKESWAP_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_PANCAKESWAP_ROUTER || '0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb';

function formatEpwxBalance(rawValue: bigint | undefined, decimals: number) {
  if (rawValue === undefined) return '';

  const normalized = Number(formatUnits(rawValue, decimals));

  if (!Number.isFinite(normalized) || normalized === 0) {
    return '0';
  }

  if (normalized >= 1) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  if (normalized >= 0.0001) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  if (normalized >= 0.00000001) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 8 });
  }

  return '<0.00000001';
}

export function EPWXStats() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Wallet connection
  const { address, isConnected } = useAccount();

  // EPWX Token contract details
  const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];

  // Read balance (only if connected)
  const {
    data: rawBalance,
    isLoading: balanceLoading,
    error: balanceError
  } = useReadContract({
    address: EPWX_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    // enabled: !!address
  });

  // Read decimals (optional, default to 18)
  const {
    data: decimals
  } = useReadContract({
    address: EPWX_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    // enabled: !!address
  });

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchPrice = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/price/epwx`);
      setPriceData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch price:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded-lg w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-3">
                <div className="h-4 bg-white/20 rounded w-2/3"></div>
                <div className="h-8 bg-white/30 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
  if (isConnected && rawBalance !== undefined && decimals !== undefined) {
    try {
      formattedBalance = formatEpwxBalance(rawBalance as bigint, decimals as number);
    } catch {
      formattedBalance = '';
    }
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-3xl font-black text-white">EPWX Token Stats</h3>
        </div>
        
        {/* Wallet Balance (if connected) */}
        {isConnected && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-white/10 rounded-xl border border-white/20 w-fit">
            <span className="text-white/80 font-semibold">Your EPWX Balance:</span>
            {balanceLoading ? (
              <span className="text-white/60 animate-pulse">Loading...</span>
            ) : balanceError ? (
              <span className="text-red-400">Error</span>
            ) : (
              <span className="text-emerald-300 font-bold">{formattedBalance}</span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Price Card */}
          <div className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute top-3 right-3 text-xl opacity-20">💰</div>
            <p className="text-white/70 text-sm font-semibold mb-2 uppercase tracking-wider">Current Price</p>
            <p className="text-3xl font-black text-white mb-1 break-all">{formatPrice(priceData.priceUSD)}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-300 font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>Live</span>
            </div>
          </div>

          {/* Market Cap Card */}
          <div className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute top-3 right-3 text-xl opacity-20">📊</div>
            <p className="text-white/70 text-sm font-semibold mb-2 uppercase tracking-wider">Market Cap</p>
            <p className="text-3xl font-black text-white mb-1">
              ${(priceData.marketCap).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-white/60 font-medium mt-2">Total Value</p>
          </div>

          {/* Liquidity Card */}
          <div className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute top-3 right-3 text-xl opacity-20">💧</div>
            <p className="text-white/70 text-sm font-semibold mb-2 uppercase tracking-wider">DEX Liquidity</p>
            <p className="text-3xl font-black text-white mb-1">
              ${priceData.liquidityUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-white/60 font-medium mt-2">Pool Depth</p>
          </div>

          {/* DEX Info Card */}
          <div className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute top-3 right-3 text-xl opacity-20">🥞</div>
            <p className="text-white/70 text-sm font-semibold mb-2 uppercase tracking-wider">Trading On</p>
            <p className="text-2xl font-black text-white mb-1">PancakeSwap</p>
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-xs text-white/80 font-semibold">Base Network</p>
              <a 
                href={`https://pancakeswap.finance/swap?chain=base&outputCurrency=${process.env.NEXT_PUBLIC_EPWX_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-300 hover:text-emerald-200 font-bold flex items-center gap-1 group-hover:underline"
              >
                Trade Now →
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <p className="text-white/70 text-sm font-semibold mb-4 uppercase tracking-wider">EPWX / USDT Pair Details</p>
            <div className="space-y-4 text-sm text-white/85">
              <div>
                <p className="text-white/60 mb-1">EPWX token</p>
                <p className="font-mono break-all text-white">{EPWX_TOKEN_ADDRESS}</p>
              </div>
              <div>
                <p className="text-white/60 mb-1">USDT token</p>
                <p className="font-mono break-all text-white">{USDT_TOKEN_ADDRESS}</p>
              </div>
              <div>
                <p className="text-white/60 mb-1">Pair contract</p>
                <p className="font-mono break-all text-white">{EPWX_USDT_PAIR_ADDRESS}</p>
              </div>
              <div>
                <p className="text-white/60 mb-1">Router</p>
                <p className="font-mono break-all text-white">{PANCAKESWAP_ROUTER_ADDRESS}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <p className="text-white/70 text-sm font-semibold mb-4 uppercase tracking-wider">Pool Snapshot</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">EPWX Reserve</p>
                <p className="text-xl font-bold text-white">{priceData.epwxReserve.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Quote Reserve</p>
                <p className="text-xl font-bold text-white">{priceData.wethReserve.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Pricing Source</p>
                <p className="text-white">
                  Current API pricing still resolves from the live EPWX quote pool. If you want this snapshot to be computed strictly from the EPWX/USDT pair, set the pair address in <span className="font-mono">NEXT_PUBLIC_EPWX_USDT_PAIR</span> and update the backend price service to use that pool.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Last updated indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-xs">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="font-medium">Updates every 30 seconds</span>
        </div>
      </div>
    </div>
  );
}
