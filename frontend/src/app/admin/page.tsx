"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";

const ADMIN_WALLET = "0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735";

export default function AdminPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<number | null>(null);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // TODO: Replace with your actual EPWX token contract address and ABI
  const EPWX_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EPWX_TOKEN_ADDRESS || "0xYourTokenAddressHere";
  const EPWX_TOKEN_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)"
  ];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/epwx/claims?admin=${ADMIN_WALLET}`)
      .then((res) => res.json())
      .then((data) => {
        setClaims(data.claims || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Send EPWX tokens from admin wallet and mark as paid after confirmation
  const distributeCashback = async (claim: any) => {
    setMarking(claim.id);
    setError(null);
    try {
      if (!walletClient || !address || address.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
        setError("Admin wallet not connected");
        setMarking(null);
        return;
      }
      // Prompt for manual confirmation and send transaction
      const provider = new ethers.BrowserProvider(walletClient); // wagmi v1+ uses EIP-1193 provider
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(EPWX_TOKEN_ADDRESS, EPWX_TOKEN_ABI, signer);
      // Convert cashbackAmount to correct decimals (assume 18 decimals, adjust if needed)
      const amount = ethers.parseUnits(claim.cashbackAmount.toString(), 18);
      const tx = await contract.transfer(claim.wallet, amount);
      await tx.wait(); // Wait for confirmation
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

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Admin: Cashback Claims</h1>
      {loading ? (
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
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
