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
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const cashbackRewardLabel = '1,000,000,000 EPWX';
  const cashbackThresholdLabel = '100,000,000,000 EPWX';

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
      <p className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Earn {cashbackRewardLabel} cashback on EPWX purchases above {cashbackThresholdLabel} made within the last 3 hours.
      </p>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading eligible transactions...</div>
      ) : unclaimedTxs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No unclaimed EPWX purchases above {cashbackThresholdLabel} in the last 3 hours.</div>
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
                        <div>
                          <div className="flex items-center mb-2">
                            <input
                              id={`agree-terms-${tx.txHash}`}
                              type="checkbox"
                              checked={agreed}
                              onChange={e => setAgreed(e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor={`agree-terms-${tx.txHash}`} className="text-xs text-gray-700">
                              I agree to the{' '}
                              <button
                                type="button"
                                className="text-blue-600 underline hover:text-blue-800"
                                onClick={() => setShowTerms(true)}
                              >
                                terms and conditions
                              </button>
                            </label>
                          </div>
                          {showTerms && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                              <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                                <button
                                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                                  onClick={() => setShowTerms(false)}
                                  aria-label="Close"
                                >
                                  &times;
                                </button>
                                <div className="prose max-w-none text-gray-900 dark:text-gray-100">
                                  <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
                                  <p className="mb-4">Welcome to EPWX Task Hub. By accessing or using our platform, you agree to these Terms and Conditions. Please read them carefully.</p>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
                                  <p className="mb-4">By using EPWX Task Hub, you agree to comply with these Terms and all applicable laws. If you do not agree, do not use the platform.</p>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">2. User Responsibilities</h2>
                                  <ul className="list-disc pl-6 mb-4">
                                    <li>Provide accurate, complete, and current information during registration and task submissions.</li>
                                    <li>Do not engage in fraudulent, abusive, or illegal activities.</li>
                                    <li>Respect other users, platform administrators, and all applicable laws.</li>
                                    <li>Maintain the confidentiality of your account credentials and notify us immediately of any unauthorized use.</li>
                                  </ul>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">3. Prohibited Conduct</h2>
                                  <ul className="list-disc pl-6 mb-4">
                                    <li>No use of bots, scripts, or automated methods to access or use the platform.</li>
                                    <li>No uploading of viruses, malware, or harmful code.</li>
                                    <li>No attempts to disrupt, damage, or gain unauthorized access to the platform or other users’ accounts.</li>
                                  </ul>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">4. Platform Rights</h2>
                                  <ul className="list-disc pl-6 mb-4">
                                    <li>We may modify, suspend, or terminate the platform or your access at any time, for any reason, without notice.</li>
                                    <li>We may change these Terms at any time. Continued use constitutes acceptance of the revised Terms.</li>
                                    <li>We reserve all rights not expressly granted to you.</li>
                                  </ul>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">5. Intellectual Property</h2>
                                  <p className="mb-4">All content, trademarks, and data on EPWX Task Hub are the property of their respective owners. You may not copy, modify, or distribute any content without permission.</p>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">6. Limitation of Liability</h2>
                                  <p className="mb-4">EPWX Task Hub is provided “as is” and “as available.” We disclaim all warranties, express or implied. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.</p>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">7. Indemnification</h2>
                                  <p className="mb-4">You agree to indemnify and hold harmless EPWX Task Hub, its affiliates, and staff from any claims, damages, or expenses arising from your use of the platform or violation of these Terms.</p>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">8. Privacy</h2>
                                  <p className="mb-4">We respect your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">9. Governing Law</h2>
                                  <p className="mb-4">These Terms are governed by the laws of the jurisdiction in which EPWX Task Hub operates.</p>
                                  <h2 className="text-lg font-semibold mt-6 mb-2">10. Contact</h2>
                                  <p>If you have questions about these Terms, please contact info@epowex.com.</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <button
                            className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 text-xs md:text-sm w-full md:w-auto"
                            onClick={() => handleClaim(tx)}
                            disabled={claiming === tx.txHash || !agreed}
                          >
                            {claiming === tx.txHash ? "Claiming..." : `Claim ${cashbackRewardLabel}`}
                          </button>
                        </div>
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