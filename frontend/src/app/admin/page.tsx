
"use client";
import React, { useState } from "react";
import { Header } from "@/components/Header";
import { ConnectKitButton } from "connectkit";
import { ethers } from "ethers";
// Add any other necessary imports (e.g., ConnectKitButton, Header, etc.)

// Add special wallet handler (stub implementation)
// (must be after imports, inside the component)

export default function AdminPage() {
  // Stub for marking referral as paid
  const markReferralPaid = (id: number, referrer: boolean, referred: boolean) => {
    setReferralRewards(prev => prev.map(r =>
      r.id === id
        ? {
            ...r,
            referrerRewarded: referrer ? true : r.referrerRewarded,
            referredRewarded: referred ? true : r.referredRewarded
          }
        : r
    ));
  };
  // Add special wallet handler (stub implementation)
  const handleAddSpecialWallet = async () => {
    if (!specialWallet) return;
    setSpecialLoading(true);
    setSpecialError(null);
    try {
      // Simulate API call to add special wallet (replace with real API call as needed)
      setSpecialClaims(prev => [
        ...prev,
        { wallet: specialWallet, status: "pending", createdAt: new Date().toISOString(), userClaimed: false }
      ]);
      setSpecialWallet("");
    } catch (e: any) {
      setSpecialError(e?.message || "Failed to add special wallet");
    }
    setSpecialLoading(false);
  };
  // State hooks for special claims
  const [specialLoading, setSpecialLoading] = useState(false);
  const [specialError, setSpecialError] = useState<string | null>(null);
  const [specialClaims, setSpecialClaims] = useState<any[]>([]);
  const [specialWallet, setSpecialWallet] = useState("");
  const [specialClaimsFilter, setSpecialClaimsFilter] = useState({ wallet: "", status: "" });
  const [specialClaimsPage, setSpecialClaimsPage] = useState(1);
  const SPECIAL_CLAIMS_PAGE_SIZE = 10;

  // State hooks for cashback claims
  const [claims, setClaims] = useState<any[]>([]);
  const [claimsFilter, setClaimsFilter] = useState({ wallet: "", status: "" });
  const [claimsPage, setClaimsPage] = useState(1);
  const CLAIMS_PAGE_SIZE = 10;

  // State hooks for daily claims
  const [dailyClaims, setDailyClaims] = useState<any[]>([]);
  const [dailyClaimsFilter, setDailyClaimsFilter] = useState({ wallet: "", status: "" });
  const [dailyClaimsPage, setDailyClaimsPage] = useState(1);
  const DAILY_CLAIMS_PAGE_SIZE = 10;

  // State hooks for marking/processing
  const [marking, setMarking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Loading state for claims
  const [loading, setLoading] = useState(false);

  // State hooks for referral rewards
  const [referralRewards, setReferralRewards] = useState<any[]>([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

  // Dummy values for address, ADMIN_WALLET, EPWX_TOKEN_ADDRESS, EPWX_TOKEN_ABI, writeContractAsync
  // Replace with actual hooks/context as needed
  const address: string = ""; // Replace with actual wallet address from context/hook
  const ADMIN_WALLET: string = ""; // Replace with actual admin wallet address
  const EPWX_TOKEN_ADDRESS = ""; // Replace with actual token address
  const EPWX_TOKEN_ABI: any[] = [];
  const writeContractAsync = async (...args: any[]) => {};
  // Approve/distribute special claim (admin only)
  const handleDistributeSpecialClaim = async (wallet: string) => {
    setSpecialLoading(true);
    setSpecialError(null);
    try {
      // Send 1,000,000 EPWX token transfer first
      if (!address || address.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
        setSpecialError("Admin wallet not connected");
        setSpecialLoading(false);
        return;
      }
      const specialAmount = ethers.parseUnits("1000000", 9).toString();
      await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS as `0x${string}`,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [wallet, specialAmount],
      });
      // After sending tokens, mark as claimed in backend
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
  // ...existing code...
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
    <>
      <Header />
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
                    const eligible = claim.userClaimed === true && claim.status === 'pending' && (now.getTime() - createdAt.getTime()) <= 3 * 60 * 60 * 1000;
                    const claimed = claim.status === 'claimed';
                    // Button enabled only if eligible (user has claimed special)
                    // Format createdAt in EST
                    const estDate = new Date(claim.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' });
                    return (
                      <tr key={idx} className="border-b last:border-none">
                        <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{claim.wallet}<br /><span className="text-xs text-gray-500">{estDate} EST</span></td>
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
      {/* Telegram Referral Rewards Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Admin: Telegram Referral Rewards</h2>
        {referralError && <div className="text-red-600 mb-2">{referralError}</div>}
        {referralLoading ? (
          <div>Loading referral rewards...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow text-xs sm:text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Referrer Wallet</th>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Telegram User ID</th>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Joined At</th>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Referrer Paid</th>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Referred Paid</th>
                  <th className="py-2 px-2 sm:px-4 text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {referralRewards.map((ref: any) => (
                  <tr key={ref.id} className="border-b last:border-none">
                    <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{ref.referrerWallet}</td>
                    <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{ref.telegramUserId}</td>
                    <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{new Date(ref.joinedAt).toLocaleString()}</td>
                    <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{ref.referrerRewarded ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{ref.referredRewarded ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-2 sm:px-4 bg-white">
                      {!ref.referrerRewarded && (
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs mr-2"
                          onClick={() => markReferralPaid(ref.id, true, false)}
                        >Mark Referrer Paid</button>
                      )}
                      {!ref.referredRewarded && (
                        <button
                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                          onClick={() => markReferralPaid(ref.id, false, true)}
                        >Mark Referred Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    </>
  );
}
