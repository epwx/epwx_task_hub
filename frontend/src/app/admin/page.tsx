"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { ethers } from "ethers";

const ADMIN_WALLET = "0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735";

export default function AdminPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [dailyClaims, setDailyClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<number | null>(null);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  // Use the existing NEXT_PUBLIC_EPWX_TOKEN env property for contract address
  const EPWX_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EPWX_TOKEN || "0xYourTokenAddressHere";
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

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/epwx/claims?admin=${ADMIN_WALLET}`).then((res) => res.json()),
      fetch(`/api/epwx/daily-claims?admin=${ADMIN_WALLET}`).then((res) => res.json()),
    ])
      .then(([claimsData, dailyClaimsData]) => {
        setClaims(claimsData.claims || []);
        setDailyClaims(dailyClaimsData.claims || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  // Send EPWX tokens for daily claim and mark as paid
  const distributeDailyClaim = async (claim: any) => {
    setMarking(claim.id);
    setError(null);
    try {
      if (!address || address.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
        setError("Admin wallet not connected");
        setMarking(null);
        return;
      }
      // Set daily reward amount (e.g., 10 EPWX)
      const dailyAmount = ethers.parseUnits("10", 9).toString();
      await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS as `0x${string}`,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [claim.wallet, dailyAmount],
      });
      // Mark as paid in backend
      const res = await fetch("/api/epwx/daily-claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: ADMIN_WALLET, claimId: claim.id }),
      });
      const data = await res.json();
      if (data.success) {
        setDailyClaims((prev) =>
          prev.map((c: any) => (c.id === claim.id ? { ...c, status: "paid" } : c))
        );
      } else {
        setError(data.error || "Failed to mark as paid");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to distribute daily claim");
    }
    setMarking(null);
  };

  // Send EPWX tokens from admin wallet and mark as paid after confirmation
  const distributeCashback = async (claim: any) => {
    setMarking(claim.id);
    setError(null);
    try {
      if (!address || address.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
        setError("Admin wallet not connected");
        setMarking(null);
        return;
      }
      // Convert cashbackAmount to correct decimals (EPWX uses 9 decimals)
      const roundedAmount = Number(claim.cashbackAmount).toFixed(9);
      const amount = ethers.parseUnits(roundedAmount, 9).toString();
      // Debug output
      console.log('EPWX transfer recipient:', claim.wallet);
      console.log('EPWX transfer amount (raw):', claim.cashbackAmount);
      console.log('EPWX transfer amount (wei):', amount);
      // Use wagmi's writeContractAsync to send the transaction
      await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS as `0x${string}`,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [claim.wallet, amount],
      });
      // After sending tokens, mark as paid in backend
      const res = await fetch("/api/epwx/claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: ADMIN_WALLET, claimId: claim.id }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims((prev) =>
          prev.map((c: any) => (c.id === claim.id ? { ...c, status: "paid" } : c))
        );
      } else {
        setError(data.error || "Failed to mark as paid");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to distribute cashback");
    }
    setMarking(null);
  };

  // Show wallet connect prompt if not connected or not admin wallet
  const notAdmin = !address || address.toLowerCase() !== ADMIN_WALLET.toLowerCase();
  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Admin: Cashback Claims</h1>
      {notAdmin ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-lg text-gray-700 font-semibold">Please connect the admin wallet to access this page.</div>
          <ConnectKitButton />
        </div>
      ) : loading ? (
        <div>Loading claims...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow text-xs sm:text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Wallet</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Tx Hash</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Amount</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Cashback</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Status</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim: any) => (
                <tr key={claim.id} className="border-b last:border-none">
                  <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{claim.wallet}</td>
                  <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{claim.txHash}</td>
                  <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claim.amount}</td>
                  <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claim.cashbackAmount}</td>
                  <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 capitalize">{claim.status}</td>
                  <td className="py-2 px-2 sm:px-4 bg-white">
                    {claim.status === "pending" ? (
                      <button
                        className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
                        disabled={marking === claim.id}
                        onClick={() => distributeCashback(claim)}
                      >
                        {marking === claim.id ? "Distributing..." : `Distribute ${claim.cashbackAmount} EPWX`}
                      </button>
                    ) : (
                      <span className="text-green-600 font-semibold">Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Daily Claims Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Admin: Daily EPWX Claims</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow text-xs sm:text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Wallet</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">IP</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Claimed At</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Status</th>
                <th className="py-2 px-2 sm:px-4 text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {dailyClaims.map((claim: any) => (
                <tr key={claim.id} className="border-b last:border-none">
                  <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{claim.wallet}</td>
                  <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claim.ip}</td>
                  <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{new Date(claim.claimedAt).toLocaleString()}</td>
                  <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 capitalize">{claim.status}</td>
                  <td className="py-2 px-2 sm:px-4 bg-white">
                    {claim.status === "pending" ? (
                      <button
                        className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
                        disabled={marking === claim.id}
                        onClick={() => distributeDailyClaim(claim)}
                      >
                        {marking === claim.id ? "Distributing..." : `Distribute Daily EPWX`}
                      </button>
                    ) : (
                      <span className="text-green-600 font-semibold">Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
