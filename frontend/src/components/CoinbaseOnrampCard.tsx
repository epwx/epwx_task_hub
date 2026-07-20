'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';

interface CoinbaseOnrampCardProps {
  compact?: boolean;
}

export function CoinbaseOnrampCard({ compact = false }: CoinbaseOnrampCardProps) {
  const { address, isConnected } = useAccount();
  const [usdAmount, setUsdAmount] = useState('100');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenCoinbaseOnramp = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);

    try {
      // Coinbase Onramp URL builder
      const onrampParams = new URLSearchParams();
      
      // Your app identifier (free, no signup needed)
      onrampParams.set('appId', 'epwx-task-hub');
      
      // Destination wallet
      onrampParams.set('destinationWallets', JSON.stringify([
        {
          address: address,
          blockchains: ['base'],
          assets: ['ETH', 'USDC']
        }
      ]));

      // Amount in fiat (optional)
      if (usdAmount && Number(usdAmount) > 0) {
        onrampParams.set('fiatAmount', usdAmount);
      }

      // Currency
      onrampParams.set('fiatCurrency', 'USD');

      // Redirect back to this page after purchase
      onrampParams.set('redirectUrl', window.location.href);

      // Payment methods the user can use
      onrampParams.set('paymentMethods', 'CARD,BANK_TRANSFER');

      // Redirect to Coinbase Onramp
      const coinbaseOnrampUrl = `https://pay.coinbase.com/buy/select-asset?${onrampParams.toString()}`;
      window.open(coinbaseOnrampUrl, '_blank', 'width=500,height=700');
    } catch (error) {
      console.error('Error opening Coinbase Onramp:', error);
      alert('Failed to open Coinbase Onramp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAmount = (amount: string) => {
    setUsdAmount(amount);
  };

  if (!isConnected) {
    return (
      <div className={`rounded-2xl border border-white/20 bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-6 backdrop-blur-lg ${compact ? 'col-span-1' : ''}`}>
        <div className="text-center">
          <div className="mb-4 text-4xl">💳</div>
          <h3 className={`font-bold text-white ${compact ? 'text-lg' : 'text-2xl'}`}>
            Buy with Card
          </h3>
          <p className={`mt-2 text-white/60 ${compact ? 'text-xs' : 'text-sm'}`}>
            Connect your wallet to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-6 backdrop-blur-lg ${compact ? '' : ''}`}>
      <div className="mb-4 flex items-center gap-2">
        <div className="text-2xl">💳</div>
        <h3 className={`font-bold text-white ${compact ? 'text-lg' : 'text-2xl'}`}>
          Buy EPWX with Card
        </h3>
      </div>

      <p className={`text-white/70 ${compact ? 'text-xs leading-5' : 'text-sm leading-6'}`}>
        Use your debit or credit card to buy ETH or USDC on Base, then swap directly to EPWX. Powered by Coinbase Pay.
      </p>

      {/* Amount Input */}
      <div className="mt-5 space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-white/60">
          USD Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
          <input
            type="number"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            placeholder="100"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-7 pr-3 text-white placeholder-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            min="1"
            max="100000"
          />
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {['50', '100', '500'].map((amount) => (
          <button
            key={amount}
            onClick={() => handleQuickAmount(amount)}
            className={`rounded-lg border transition ${
              usdAmount === amount
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
            } py-2 text-sm font-semibold`}
          >
            ${amount}
          </button>
        ))}
      </div>

      {/* Main Button */}
      <button
        onClick={handleOpenCoinbaseOnramp}
        disabled={isLoading || !usdAmount || Number(usdAmount) <= 0}
        className={`mt-5 w-full rounded-2xl px-5 py-3 font-bold text-white transition ${
          isLoading || !usdAmount || Number(usdAmount) <= 0
            ? 'cursor-not-allowed bg-white/5 text-white/40'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
        }`}
      >
        {isLoading ? 'Opening Coinbase Pay...' : `Buy ${usdAmount ? `$${usdAmount}` : 'EPWX'} with Card`}
      </button>

      {/* Info Text */}
      <p className={`mt-3 text-white/60 ${compact ? 'text-xs' : 'text-xs'}`}>
        ✓ Fast & secure payments
        <br />✓ Multiple payment methods
        <br />✓ Instant crypto to your wallet
      </p>

      {/* After Purchase Instructions */}
      <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
        <p className="text-xs font-semibold text-emerald-200">💡 After Purchase</p>
        <p className="mt-1 text-xs text-emerald-100/80">
          Your ETH or USDC will arrive in your connected wallet. Return here to swap for EPWX or use any DEX.
        </p>
      </div>
    </div>
  );
}
