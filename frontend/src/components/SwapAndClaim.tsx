import React, { useState } from 'react';
import { ethers } from 'ethers';
import { swapEthToEpwx } from '../utils/swapEthToEpwx';

interface SwapProps {
  swapAmountEth: number; // Fixed ETH amount to swap
  slotsLeft: number;
  epwxPerEth: number; // Conversion rate
}

const SwapAndClaim: React.FC<SwapProps> = ({ swapAmountEth, slotsLeft, epwxPerEth }) => {
  const [swapped, setSwapped] = useState(false);
  const [claimable, setClaimable] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleSwap = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const userAddress = accounts[0];
      if (!userAddress) throw new Error('Wallet not connected');
      // On-chain swap: user approves and sends transaction
      const txHash = await swapEthToEpwx({ provider, amountEth: swapAmountEth.toString(), userAddress });
      setSwapped(true);
      setClaimable(true);
      alert('Swap successful! Tx: ' + txHash);
    } catch (err: any) {
      alert(err.message || 'Swap failed');
    }
    setLoading(false);
  };


  const handleClaim = async () => {
    setLoading(true);
    try {
      let userAddress = '';
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
      }
      if (!userAddress) throw new Error('Wallet not connected');
      const res = await fetch('/api/swap/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress, epwxAmount: claimAmount })
      });
      const data = await res.json();
      if (data.success) {
        setClaimable(false);
        alert('Claimed successfully!');
      } else {
        alert(data.error || 'Claim failed');
      }
    } catch (err: any) {
      alert(err.message || 'Claim failed');
    }
    setLoading(false);
  };

  const epwxAmount = swapAmountEth * epwxPerEth;
  const claimAmount = epwxAmount * 0.01;

  return (
    <div className="border rounded p-4 max-w-md mx-auto bg-white shadow">
      <h2 className="text-xl font-bold mb-2">Swap ETH to EPWX</h2>
      <p>Amount: <b>{swapAmountEth} ETH</b></p>
      <p>Slots left: <b>{slotsLeft}</b></p>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleSwap}
        disabled={loading || swapped || slotsLeft === 0}
      >
        {loading && !swapped ? 'Swapping...' : swapped ? 'Swapped' : `Swap ${swapAmountEth} ETH`}
      </button>
      {claimable && (
        <div className="mt-6">
          <p className="mb-2">You can claim <b>{claimAmount.toFixed(4)} EPWX</b> (1% of your swap)</p>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            onClick={handleClaim}
            disabled={loading}
          >
            {loading ? 'Claiming...' : `Claim ${claimAmount.toFixed(4)} EPWX`}
          </button>
        </div>
      )}
    </div>
  );
};

export default SwapAndClaim;
