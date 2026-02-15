import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletClient, useWriteContract } from "wagmi";
import { ethers } from "ethers";

export function EPWXCashbackClaim() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<{ [txHash: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  // Fetch claimed transactions for this wallet
  useEffect(() => {
    if (!address) {
      setClaimed({});
      return;
    }
    fetch(`/api/epwx/claims?wallet=${address}`)
      .then(res => res.json())
      .then(data => {
        const claimedMap: { [txHash: string]: boolean } = {};
        (data.claims || []).forEach((claim: any) => {
          claimedMap[claim.txHash] = true;
        });
        setClaimed(claimedMap);
      })
      .catch(() => setClaimed({}));
  }, [address]);

  // Fetch eligible transactions for this wallet
  useEffect(() => {
    if (!address) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    fetch(`/api/epwx/eligible?wallet=${address}`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => {
        setTransactions([]);
        setLoading(false);
      });
  }, [address, claimed]);

  // Get admin wallets from env
  const getAdminWallets = () => {
    if (typeof window !== "undefined") {
      const env = process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
      return env.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
    }
    return [];
  };

  // Admin distribute handler
  const distributeCashback = async (tx: any) => {
    setMarking(tx.txHash);
    setError(null);
    try {
      const adminWallets = getAdminWallets();
      if (!address || !adminWallets.includes(address.toLowerCase())) {
        setError("Admin wallet not connected");
        setMarking(null);
        return;
      }
      // Convert amount to correct decimals (EPWX uses 9 decimals)
      const roundedAmount = Number(tx.amount).toFixed(9);
      const amount = ethers.parseUnits(roundedAmount, 9).toString();
      await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [tx.wallet, amount],
      });
      // Mark as paid in backend
      const res = await fetch("/api/epwx/claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, claimId: tx.id }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimed((prev) => ({ ...prev, [tx.txHash]: true }));
      } else {
        setError(data.error || "Failed to mark as paid");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to distribute cashback");
    }
    setMarking(null);
  };

  const handleClaim = async (tx: any) => {
    setClaiming(tx.txHash);
    setError(null);
    try {
      const res = await fetch('/api/epwx/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, txHash: tx.txHash, amount: tx.amount })
      });
      const data = await res.json();
      if (data.success) {
        setClaimed(prev => ({ ...prev, [tx.txHash]: true }));
      } else {
        setError(data.error || 'Claim failed');
      }
    } catch (e) {
      setError('Claim failed');
    }
    setClaiming(null);
  };

  const unclaimedTxs = transactions.filter((tx: any) => !claimed[tx.txHash]);
  const claimedTxs = transactions.filter((tx: any) => claimed[tx.txHash]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-lg p-4 mb-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">EPWX Cashback Rewards</h2>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading eligible transactions...</div>
      ) : unclaimedTxs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No unclaimed EPWX swap transactions in the last 3 hours.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-2 text-xs font-semibold text-gray-600">Tx Hash</th>
                <th className="py-2 px-2 text-xs font-semibold text-gray-600">Amount</th>
                <th className="py-2 px-2 text-xs font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {unclaimedTxs.map((tx: any) => (
                <tr key={tx.txHash} className="border-b last:border-none">
                  <td className="py-2 px-2 text-xs break-all max-w-[120px] md:max-w-xs text-gray-900 bg-white">{tx.txHash}</td>
                  <td className="py-2 px-2 text-xs text-gray-900 bg-white">{tx.amount}</td>
                  <td className="py-2 px-2">
                    {(() => {
                      if (!address) return null;
                      const adminWallets = getAdminWallets();
                      if (adminWallets.includes(address.toLowerCase())) {
                        // Admin action
                        return (
                          <button
                            className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 text-xs md:text-sm w-full md:w-auto"
                            onClick={() => distributeCashback(tx)}
                            disabled={marking === tx.txHash}
                          >
                            {marking === tx.txHash ? "Distributing..." : "Distribute EPWX"}
                          </button>
                        );
                      }
                      // User action
                      return !claimed[tx.txHash] ? (
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 text-xs md:text-sm w-full md:w-auto"
                          onClick={() => handleClaim(tx)}
                          disabled={claiming === tx.txHash}
                        >
                          {claiming === tx.txHash ? "Claiming..." : "Claim 3% Cashback"}
                        </button>
                      ) : (
                        <span className="text-green-600 font-bold">Claimed</span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Claimed transactions section */}
      {claimedTxs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2 text-center text-gray-700">Claimed Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-600">Tx Hash</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {claimedTxs.map((tx: any) => (
                  <tr key={tx.txHash} className="border-b last:border-none">
                    <td className="py-2 px-2 text-xs break-all max-w-[120px] md:max-w-xs text-gray-900 bg-white">{tx.txHash}</td>
                    <td className="py-2 px-2 text-xs text-gray-900 bg-white">{tx.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
    </div>
  );
}

// Define the EPWX token address and ABI
const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const EPWX_TOKEN_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];