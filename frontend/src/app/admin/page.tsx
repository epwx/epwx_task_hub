"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { ethers } from "ethers";

const ADMIN_WALLET = "0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735";

export default function AdminPage() {
    // Special Claims Pagination/Filter
    const [specialClaimsPage, setSpecialClaimsPage] = useState(1);
      const [specialClaimsFilter, setSpecialClaimsFilter] = useState({ wallet: '', status: 'claimed' });
    const SPECIAL_CLAIMS_PAGE_SIZE = 5;
  const [claims, setClaims] = useState<any[]>([]);
  const [dailyClaims, setDailyClaims] = useState<any[]>([]);
  // Special Claims State
  const [specialClaims, setSpecialClaims] = useState<any[]>([]);
  const [specialWallet, setSpecialWallet] = useState("");
  const [specialLoading, setSpecialLoading] = useState(false);
  const [specialError, setSpecialError] = useState<string | null>(null);
  // Pagination and filter state
  const [claimsPage, setClaimsPage] = useState(1);
  const [dailyClaimsPage, setDailyClaimsPage] = useState(1);
  const [claimsFilter, setClaimsFilter] = useState({ wallet: '', status: 'pending' });
  const [dailyClaimsFilter, setDailyClaimsFilter] = useState({ wallet: '', status: 'pending' });
  const CLAIMS_PAGE_SIZE = 5;
  const DAILY_CLAIMS_PAGE_SIZE = 5;
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
      fetch(`/api/epwx/special-claim/list?admin=${ADMIN_WALLET}`).then((res) => res.json()),
    ])
      .then(([claimsData, dailyClaimsData, specialClaimsData]) => {
        setClaims(claimsData.claims || []);
        setDailyClaims(dailyClaimsData.claims || []);
        setSpecialClaims(specialClaimsData.claims || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
    // Add wallet to special claim list
    const handleAddSpecialWallet = async () => {
      setSpecialLoading(true);
      setSpecialError(null);
      try {
        const res = await fetch("/api/epwx/special-claim/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: specialWallet,
            admin: address // send connected wallet as admin
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSpecialClaims((prev) => [...prev, { wallet: specialWallet, eligible: true, claimed: false }]);
          setSpecialWallet("");
        } else {
          setSpecialError(data.error || "Failed to add wallet");
        }
      } catch (e: any) {
        setSpecialError(e?.message || "Failed to add wallet");
      }
      setSpecialLoading(false);
    };

    // Approve/distribute special claim (admin only)
    const handleDistributeSpecialClaim = async (wallet: string) => {
      setSpecialLoading(true);
      setSpecialError(null);
      try {
        const res = await fetch("/api/epwx/special-claim/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, admin: address }),
        });
        const data = await res.json();
        if (data.success) {
          setSpecialClaims((prev) => prev.map((c) => c.wallet === wallet ? { ...c, status: "claimed" } : c));
        } else {
          setSpecialError(data.error || "Failed to approve/distribute claim");
        }
      } catch (e: any) {
        setSpecialError(e?.message || "Failed to approve/distribute claim");
      }
      setSpecialLoading(false);
    };
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
      // Set daily reward amount (100,000 EPWX)
      const dailyAmount = ethers.parseUnits("100000", 9).toString();
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
      {/* Show ConnectKitButton globally if not connected */}
      {!address && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-2 text-lg text-gray-700 font-semibold">Please connect your wallet to access admin features.</div>
          <ConnectKitButton />
        </div>
      )}
      {/* Special Claim Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Admin: Special EPWX Claims</h2>
        {!address ? (
          <div className="mb-4 flex flex-col items-center">
            <div className="mb-2 text-gray-700">Please connect your wallet to manage special claims.</div>
            <ConnectKitButton />
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Wallet address"
                className="border rounded px-2 py-1 bg-gray-100 text-gray-900"
                value={specialWallet}
                onChange={e => setSpecialWallet(e.target.value)}
              />
              <button
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={specialLoading || !specialWallet}
                onClick={handleAddSpecialWallet}
              >{specialLoading ? "Adding..." : "Add Wallet"}</button>
            </div>
            {/* Special Claims Filter Controls */}
            <div className="mb-2 flex gap-2 items-center">
              <input
                type="text"
                placeholder="Filter by wallet"
                className="border rounded px-2 py-1 bg-gray-100 text-gray-900"
                value={specialClaimsFilter.wallet}
                onChange={e => setSpecialClaimsFilter(f => ({ ...f, wallet: e.target.value }))}
              />
              <select
                className="border rounded px-2 py-1 bg-white text-gray-900"
                value={specialClaimsFilter.status}
                onChange={e => setSpecialClaimsFilter(f => ({ ...f, status: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="claimed">Claimed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            {specialError && <div className="text-red-600 mb-2">{specialError}</div>}
            <table className="min-w-full bg-white rounded shadow text-xs sm:text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Wallet</th>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Eligible</th>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Claimed</th>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {specialClaims
                  .filter((claim: any) =>
                    (!specialClaimsFilter.wallet || claim.wallet.toLowerCase().includes(specialClaimsFilter.wallet.toLowerCase())) &&
                    (!specialClaimsFilter.status || (specialClaimsFilter.status === 'claimed' ? claim.status === 'claimed' : claim.status !== 'claimed'))
                  )
                  .slice((specialClaimsPage - 1) * SPECIAL_CLAIMS_PAGE_SIZE, specialClaimsPage * SPECIAL_CLAIMS_PAGE_SIZE)
                  .map((claim: any, idx: number) => {
                    // Eligibility: pending and within 3 hours
                    const now = new Date();
                    const createdAt = new Date(claim.createdAt);
                    const within3Hours = claim.status === 'pending' && (now.getTime() - createdAt.getTime()) <= 3 * 60 * 60 * 1000;
                    const eligible = within3Hours;
                    const claimed = claim.status === 'claimed';
                    return (
                      <tr key={idx} className="border-b last:border-none">
                        <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{claim.wallet}</td>
                        <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{eligible ? "Yes" : "No"}</td>
                        <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claimed ? "Yes" : "No"}</td>
                        <td className="py-2 px-2 sm:px-4 bg-white">
                          {!claimed && eligible ? (
                            <button
                              className="px-2 sm:px-4 py-1 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs sm:text-sm"
                              disabled={specialLoading}
                              onClick={() => handleDistributeSpecialClaim(claim.wallet)}
                            >{specialLoading ? "Processing..." : "Distribute 1M EPWX"}</button>
                          ) : (
                            <span className="text-green-600 font-semibold">{claimed ? "Claimed" : "N/A"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {/* Pagination controls for special claims */}
            <div className="py-2 px-2 bg-gray-50 text-center">
              <button
                className="px-2 py-1 mr-2 border rounded bg-blue-100 text-blue-900 font-bold hover:bg-blue-200"
                disabled={specialClaimsPage === 1}
                onClick={() => setSpecialClaimsPage(p => Math.max(1, p - 1))}
              >Prev</button>
              <span>Page {specialClaimsPage}</span>
              <button
                className="px-2 py-1 ml-2 border rounded bg-blue-100 text-blue-900 font-bold hover:bg-blue-200"
                disabled={specialClaimsPage * SPECIAL_CLAIMS_PAGE_SIZE >= specialClaims.filter((claim: any) =>
                  (!specialClaimsFilter.wallet || claim.wallet.toLowerCase().includes(specialClaimsFilter.wallet.toLowerCase())) &&
                  (!specialClaimsFilter.status || (specialClaimsFilter.status === 'claimed' ? claim.claimed : !claim.claimed))
                ).length}
                onClick={() => setSpecialClaimsPage(p => p + 1)}
              >Next</button>
            </div>
          </>
        )}
      </div>
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
              {/* Filter controls for cashback claims */}
              <tr>
                <td colSpan={6} className="py-2 px-2 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Filter by wallet"
                    className="border rounded px-2 py-1 mr-2 bg-gray-100 text-gray-900"
                    value={claimsFilter.wallet}
                    onChange={e => setClaimsFilter(f => ({ ...f, wallet: e.target.value }))}
                  />
                  <select
                    className="border rounded px-2 py-1 bg-white text-gray-900"
                    value={claimsFilter.status}
                    onChange={e => setClaimsFilter(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </td>
              </tr>
              {/* Paginated and filtered cashback claims */}
              {claims
                .filter((claim: any) =>
                  (!claimsFilter.wallet || claim.wallet.toLowerCase().includes(claimsFilter.wallet.toLowerCase())) &&
                  (!claimsFilter.status || claim.status === claimsFilter.status)
                )
                .slice((claimsPage - 1) * CLAIMS_PAGE_SIZE, claimsPage * CLAIMS_PAGE_SIZE)
                .map((claim: any) => (
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
              {/* Pagination controls for cashback claims */}
              <tr>
                <td colSpan={6} className="py-2 px-2 bg-gray-50 text-center">
                  <button
                    className="px-2 py-1 mr-2 border rounded bg-blue-100 text-blue-900 font-bold hover:bg-blue-200"
                    disabled={claimsPage === 1}
                    onClick={() => setClaimsPage(p => Math.max(1, p - 1))}
                  >Prev</button>
                  <span>Page {claimsPage}</span>
                  <button
                    className="px-2 py-1 ml-2 border rounded bg-blue-100 text-blue-900 font-bold hover:bg-blue-200"
                    disabled={claimsPage * CLAIMS_PAGE_SIZE >= claims.filter((claim: any) =>
                      (!claimsFilter.wallet || claim.wallet.toLowerCase().includes(claimsFilter.wallet.toLowerCase())) &&
                      (!claimsFilter.status || claim.status === claimsFilter.status)
                    ).length}
                    onClick={() => setClaimsPage(p => p + 1)}
                  >Next</button>
                </td>
              </tr>
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
              {/* Filter controls for daily claims */}
              <tr>
                <td colSpan={5} className="py-2 px-2 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Filter by wallet"
                    className="border rounded px-2 py-1 mr-2 bg-gray-100 text-gray-900"
                    value={dailyClaimsFilter.wallet}
                    onChange={e => setDailyClaimsFilter(f => ({ ...f, wallet: e.target.value }))}
                  />
                  <select
                    className="border rounded px-2 py-1 bg-white text-gray-900"
                    value={dailyClaimsFilter.status}
                    onChange={e => setDailyClaimsFilter(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </td>
              </tr>
              {/* Paginated and filtered daily claims */}
              {dailyClaims
                .filter((claim: any) =>
                  (!dailyClaimsFilter.wallet || claim.wallet.toLowerCase().includes(dailyClaimsFilter.wallet.toLowerCase())) &&
                  (!dailyClaimsFilter.status || claim.status === dailyClaimsFilter.status)
                )
                .slice((dailyClaimsPage - 1) * DAILY_CLAIMS_PAGE_SIZE, dailyClaimsPage * DAILY_CLAIMS_PAGE_SIZE)
                .map((claim: any) => (
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
              {/* Pagination controls for daily claims */}
              <tr>
                <td colSpan={5} className="py-2 px-2 bg-gray-50 text-center">
                  <button
                    className="px-2 py-1 mr-2 border rounded bg-blue-100 text-blue-900 font-bold hover:bg-blue-200"
                    disabled={dailyClaimsPage === 1}
                    onClick={() => setDailyClaimsPage(p => Math.max(1, p - 1))}
                  >Prev</button>
                  <span>Page {dailyClaimsPage}</span>
                  <button
                    className="px-2 py-1 ml-2 border rounded bg-blue-100 text-blue-900 font-bold hover:bg-blue-200"
                    disabled={dailyClaimsPage * DAILY_CLAIMS_PAGE_SIZE >= dailyClaims.filter((claim: any) =>
                      (!dailyClaimsFilter.wallet || claim.wallet.toLowerCase().includes(dailyClaimsFilter.wallet.toLowerCase())) &&
                      (!dailyClaimsFilter.status || claim.status === dailyClaimsFilter.status)
                    ).length}
                    onClick={() => setDailyClaimsPage(p => p + 1)}
                  >Next</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
