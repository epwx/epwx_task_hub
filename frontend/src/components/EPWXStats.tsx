'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface PriceData {
  priceUSD: number;
  liquidityUSD: number;
  marketCap: number;
  epwxReserve: number;
  wethReserve: number;
}

export function EPWXStats() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

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

        {/* Last updated indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-xs">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="font-medium">Updates every 30 seconds</span>
        </div>
      </div>
    </div>
  );
}
