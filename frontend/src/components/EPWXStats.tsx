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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!priceData) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
      <h3 className="text-xl font-semibold mb-4">EPWX Token Stats</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-blue-200 text-sm mb-1">Price</p>
          <p className="text-2xl font-bold">${priceData.priceUSD.toFixed(12)}</p>
        </div>
        <div>
          <p className="text-blue-200 text-sm mb-1">Market Cap</p>
          <p className="text-2xl font-bold">${(priceData.marketCap).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div>
          <p className="text-blue-200 text-sm mb-1">Liquidity</p>
          <p className="text-2xl font-bold">${priceData.liquidityUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div>
          <p className="text-blue-200 text-sm mb-1">DEX</p>
          <p className="text-lg font-semibold">PancakeSwap V2</p>
          <p className="text-xs text-blue-200">Base Network</p>
        </div>
      </div>
    </div>
  );
}
