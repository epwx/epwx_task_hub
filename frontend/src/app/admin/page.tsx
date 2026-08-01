"use client";

import { useEffect, useMemo, useState } from "react";
import DailyClaimsTable from "@/components/DailyClaimsTable";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { ethers } from "ethers";

const getAdminWallets = () => {
  if (typeof window !== "undefined") {
    const env = process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
    return env.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
  }
  return [];
};

export default function AdminPage() {
  const [specialClaimsPage, setSpecialClaimsPage] = useState(1);
  const [specialClaimsFilter, setSpecialClaimsFilter] = useState({ wallet: "", status: "pending" });
  const SPECIAL_CLAIMS_PAGE_SIZE = 5;

  const [claims, setClaims] = useState<any[]>([]);
  const [dailyClaims, setDailyClaims] = useState<any[]>([]);
  const [specialClaims, setSpecialClaims] = useState<any[]>([]);
  const [specialWallet, setSpecialWallet] = useState("");
  const [specialLoading, setSpecialLoading] = useState(false);
  const [specialError, setSpecialError] = useState<string | null>(null);
  const [specialResult, setSpecialResult] = useState<any[] | null>(null);

  const [claimsPage, setClaimsPage] = useState(1);
  const [dailyClaimsPage, setDailyClaimsPage] = useState(1);
  const [claimsFilter, setClaimsFilter] = useState({ wallet: "", status: "pending" });
  const [dailyClaimsFilter, setDailyClaimsFilter] = useState({ wallet: "", status: "pending" });

  const CLAIMS_PAGE_SIZE = 5;
  const DAILY_CLAIMS_PAGE_SIZE = 5;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<number | null>(null);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const pageShellClass = "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8";
  const glassPanelClass = "rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-lg";
  const filterInputClass = "w-full rounded-xl border border-white/15 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 sm:w-auto";
  const filterSelectClass = "rounded-xl border border-white/15 bg-slate-950/40 px-3 py-2 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20";
  const paginationBtnClass = "rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-40";

  const EPWX_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EPWX_TOKEN || "0xYourTokenAddressHere";
  const FIXED_CASHBACK_AMOUNT = "1000000000";
  const FIXED_CASHBACK_LABEL = Number(FIXED_CASHBACK_AMOUNT).toLocaleString();
  const EPWX_TOKEN_ABI = [
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  useEffect(() => {
    setLoading(true);
    const adminWallets = getAdminWallets();
    const admin = adminWallets[0] || "";
    Promise.all([
      fetch(`/api/epwx/claims?admin=${admin}`).then((res) => res.json()),
      fetch(`/api/epwx/daily-claims?admin=${admin}`).then((res) => res.json()),
      fetch(`/api/epwx/special-claim/list?admin=${admin}`).then((res) => res.json()),
    ])
      .then(([claimsData, dailyClaimsData, specialClaimsData]) => {
        setClaims(claimsData.claims || []);
        setDailyClaims(dailyClaimsData.claims || []);
        setSpecialClaims(specialClaimsData.claims || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAddSpecialWallet = async () => {
    setSpecialLoading(true);
    setSpecialError(null);
    setSpecialResult(null);
    try {
      const res = await fetch("/api/epwx/special-claim/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: specialWallet, admin: address }),
      });
      const data = await res.json();
      if (data.success) {
        setSpecialResult(data.results);
        setSpecialWallet("");
      } else {
        setSpecialError(data.error || "Failed to add wallet(s)");
      }
    } catch (e: any) {
      setSpecialError(e?.message || "Failed to add wallet(s)");
    }
    setSpecialLoading(false);
  };

  const handleDistributeSpecialClaim = async (wallet: string) => {
    setSpecialLoading(true);
    setSpecialError(null);
    try {
      const adminWallets = getAdminWallets();
      if (!address || !adminWallets.includes(address.toLowerCase())) {
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
      const res = await fetch("/api/epwx/special-claim/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, admin: address }),
      });
      const data = await res.json();
      if (data.success) {
        setSpecialClaims((prev) => prev.map((c) => (c.wallet === wallet ? { ...c, status: "claimed" } : c)));
      } else {
        setSpecialError(data.error || "Failed to approve/distribute claim");
      }
    } catch (e: any) {
      setSpecialError(e?.message || "Failed to approve/distribute claim");
    }
    setSpecialLoading(false);
  };

  const distributeDailyClaim = async (claim: any) => {
    setMarking(claim.id);
    setError(null);
    try {
      const adminWallets = getAdminWallets();
      if (!address || !adminWallets.includes(address.toLowerCase())) {
        setError("Admin wallet not connected");
        setMarking(null);
        return;
      }
      const rewardAmount = claim.amount || "100000";
      const dailyAmount = ethers.parseUnits(rewardAmount, 9).toString();
      const tx = await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS as `0x${string}`,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [claim.wallet, dailyAmount],
      });
      if (!publicClient) {
        setError("Public client not available");
        setMarking(null);
        return;
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== "success") {
        setError("Token transfer failed or was reverted");
        setMarking(null);
        return;
      }
      const res = await fetch("/api/epwx/daily-claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, claimId: claim.id, txHash: tx }),
      });
      const data = await res.json();
      if (data.success) {
        setDailyClaims((prev) => prev.map((c: any) => (c.id === claim.id ? { ...c, status: "paid", txHash: tx } : c)));
      } else {
        setError(data.error || "Failed to mark as paid");
      }
      console.log("Backend response for mark-paid:", data);
    } catch (e: any) {
      setError(e?.message || "Failed to distribute daily claim");
    }
    setMarking(null);
  };

  const distributeCashback = async (claim: any) => {
    setMarking(claim.id);
    setError(null);
    try {
      const adminWallets = getAdminWallets();
      if (!address || !adminWallets.includes(address.toLowerCase())) {
        setError("Admin wallet not connected");
        setMarking(null);
        return;
      }
      const roundedAmount = Number(FIXED_CASHBACK_AMOUNT).toFixed(9);
      const amount = ethers.parseUnits(roundedAmount, 9).toString();
      console.log("EPWX transfer recipient:", claim.wallet);
      console.log("EPWX transfer amount (raw):", FIXED_CASHBACK_AMOUNT);
      console.log("EPWX transfer amount (wei):", amount);
      const tx = await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS as `0x${string}`,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [claim.wallet, amount],
      });
      if (!publicClient) {
        setError("Public client not available");
        setMarking(null);
        return;
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== "success") {
        setError("Token transfer failed or was reverted");
        setMarking(null);
        return;
      }
      const res = await fetch("/api/epwx/claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, claimId: claim.id, txHash: tx, claimSource: "cashback" }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims((prev) => prev.map((c: any) => (c.id === claim.id ? { ...c, status: "paid", txHash: tx } : c)));
      } else {
        setError(data.error || "Failed to mark as paid");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to distribute cashback");
    }
    setMarking(null);
  };

  const adminWallets = getAdminWallets();
  const notAdmin = !address || !adminWallets.includes(address.toLowerCase());

  const filteredSpecialClaims = useMemo(
    () =>
      specialClaims.filter(
        (claim: any) =>
          (!specialClaimsFilter.wallet || claim.wallet.toLowerCase().includes(specialClaimsFilter.wallet.toLowerCase())) &&
          (!specialClaimsFilter.status || (specialClaimsFilter.status === "claimed" ? claim.status === "claimed" : claim.status !== "claimed"))
      ),
    [specialClaims, specialClaimsFilter]
  );

  const filteredCashbackClaims = useMemo(
    () =>
      claims.filter(
        (claim: any) =>
          (!claimsFilter.wallet || claim.wallet.toLowerCase().includes(claimsFilter.wallet.toLowerCase())) &&
          (!claimsFilter.status || claim.status === claimsFilter.status)
      ),
    [claims, claimsFilter]
  );

  const filteredDailyClaims = useMemo(
    () =>
      dailyClaims.filter(
        (claim: any) =>
          (!dailyClaimsFilter.wallet || claim.wallet.toLowerCase().includes(dailyClaimsFilter.wallet.toLowerCase())) &&
          (!dailyClaimsFilter.status || claim.status === dailyClaimsFilter.status)
      ),
    [dailyClaims, dailyClaimsFilter]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-cyan-500/12 blur-[90px] sm:-left-32 sm:h-80 sm:w-80 sm:blur-[130px]" />
        <div className="absolute -right-16 top-20 h-64 w-64 rounded-full bg-blue-600/16 blur-[100px] sm:-right-28 sm:h-96 sm:w-96 sm:blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 h-44 w-[20rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[90px] sm:h-72 sm:w-[38rem] sm:blur-[150px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl min-w-0 space-y-6">
        <section className={pageShellClass}>
          <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative z-10 flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Admin Dashboard</div>
              <h1 className="mt-2 text-3xl font-black text-white">Claims and reward operations</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">Manage special claims, cashback distributions, and daily claim payouts from one operator panel.</p>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Special</div>
                <div className="mt-2 text-2xl font-black text-white">{specialClaims.length}</div>
              </div>
              <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Cashback</div>
                <div className="mt-2 text-2xl font-black text-cyan-200">{claims.length}</div>
              </div>
              <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Daily</div>
                <div className="mt-2 text-2xl font-black text-emerald-200">{dailyClaims.length}</div>
              </div>
            </div>
          </div>
        </section>

        {!address ? (
          <section className={pageShellClass}>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="text-lg font-semibold text-white">Please connect your wallet to access admin features.</div>
              <div className="mt-4"><ConnectKitButton /></div>
            </div>
          </section>
        ) : null}

        <section className={pageShellClass}>
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white">Admin: Special EPWX Claims</h2>
            {!address ? (
              <div className="mt-4 text-slate-300">Please connect your wallet to manage special claims.</div>
            ) : (
              <>
                <div className="mt-4 grid gap-4">
                  <textarea
                    placeholder="Enter wallet addresses, comma separated (e.g. 0x123..., 0x456..., ...)"
                    className="min-h-[88px] w-full rounded-2xl border border-white/15 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    value={specialWallet}
                    onChange={e => setSpecialWallet(e.target.value)}
                  />
                  <button
                    className="ui-btn-primary w-fit rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                    disabled={specialLoading || !specialWallet}
                    onClick={handleAddSpecialWallet}
                  >{specialLoading ? "Adding..." : "Add Wallets"}</button>

                  {specialResult ? (
                    <div className={`${glassPanelClass} p-4`}>
                      <div className="mb-2 text-sm font-semibold text-white">Bulk Add Results</div>
                      <ul className="list-disc ml-6 text-sm">
                        {specialResult.map((r, i) => (
                          <li key={i} className={r.error ? "text-rose-200" : r.updated ? "text-amber-200" : "text-emerald-200"}>
                            {r.wallet}: {r.created ? "Created" : r.updated ? "Updated" : r.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Filter by wallet"
                    className={filterInputClass}
                    value={specialClaimsFilter.wallet}
                    onChange={e => setSpecialClaimsFilter((f) => ({ ...f, wallet: e.target.value }))}
                  />
                  <select
                    className={filterSelectClass}
                    value={specialClaimsFilter.status}
                    onChange={e => setSpecialClaimsFilter((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    <option value="claimed">Claimed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {specialError ? <div className="mt-3 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{specialError}</div> : null}

                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/12 bg-slate-950/45 shadow-[0_16px_40px_rgba(2,6,23,0.25)]">
                  <table className="min-w-full text-xs text-white sm:text-sm">
                    <thead className="bg-white/[0.06] text-slate-300">
                      <tr>
                        <th className="px-3 py-3 text-left">Wallet</th>
                        <th className="px-3 py-3 text-left">Eligible</th>
                        <th className="px-3 py-3 text-left">Claimed</th>
                        <th className="px-3 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSpecialClaims
                        .slice((specialClaimsPage - 1) * SPECIAL_CLAIMS_PAGE_SIZE, specialClaimsPage * SPECIAL_CLAIMS_PAGE_SIZE)
                        .map((claim: any, idx: number) => {
                          const now = new Date();
                          const createdAt = new Date(claim.createdAt);
                          const eligible = claim.userClaimed === true && claim.status === "pending" && (now.getTime() - createdAt.getTime()) <= 3 * 60 * 60 * 1000;
                          const claimed = claim.status === "claimed";
                          const estDate = new Date(claim.createdAt).toLocaleString("en-US", { timeZone: "America/New_York" });
                          return (
                            <tr key={idx} className="border-t border-white/10">
                              <td className="px-3 py-3 break-all text-slate-100">{claim.wallet}<br /><span className="text-xs text-slate-400">{estDate} EST</span></td>
                              <td className="px-3 py-3 text-slate-100">{eligible ? "Yes" : "No"}</td>
                              <td className="px-3 py-3 text-slate-100">{claimed ? "Yes" : "No"}</td>
                              <td className="px-3 py-3">
                                {!claimed && eligible ? (
                                  <button
                                    className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 sm:text-sm"
                                    disabled={specialLoading}
                                    onClick={() => handleDistributeSpecialClaim(claim.wallet)}
                                  >{specialLoading ? "Processing..." : "Distribute 1M EPWX"}</button>
                                ) : (
                                  <span className="font-semibold text-emerald-200">{claimed ? "Claimed" : "N/A"}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-center gap-3">
                  <button className={paginationBtnClass} disabled={specialClaimsPage === 1} onClick={() => setSpecialClaimsPage((p) => Math.max(1, p - 1))}>Prev</button>
                  <span className="text-sm font-semibold text-slate-300">Page {specialClaimsPage}</span>
                  <button
                    className={paginationBtnClass}
                    disabled={specialClaimsPage * SPECIAL_CLAIMS_PAGE_SIZE >= specialClaims.filter((claim: any) =>
                      (!specialClaimsFilter.wallet || claim.wallet.toLowerCase().includes(specialClaimsFilter.wallet.toLowerCase())) &&
                      (!specialClaimsFilter.status || (specialClaimsFilter.status === "claimed" ? claim.claimed : !claim.claimed))
                    ).length}
                    onClick={() => setSpecialClaimsPage((p) => p + 1)}
                  >Next</button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className={pageShellClass}>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white">Admin: Cashback Claims</h2>
            {notAdmin ? (
              <div className="mt-4 flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 text-lg font-semibold text-slate-200">Please connect the admin wallet to access this section.</div>
                <ConnectKitButton />
              </div>
            ) : loading ? (
              <div className={`${glassPanelClass} mt-4 p-4 text-sm text-slate-300`}>Loading claims...</div>
            ) : (
              <>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Filter by wallet"
                    className={filterInputClass}
                    value={claimsFilter.wallet}
                    onChange={e => setClaimsFilter((f) => ({ ...f, wallet: e.target.value }))}
                  />
                  <select
                    className={filterSelectClass}
                    value={claimsFilter.status}
                    onChange={e => setClaimsFilter((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/12 bg-slate-950/45 shadow-[0_16px_40px_rgba(2,6,23,0.25)]">
                  <table className="min-w-full text-xs text-white sm:text-sm">
                    <thead className="bg-white/[0.06] text-slate-300">
                      <tr>
                        <th className="px-3 py-3 text-left">Wallet</th>
                        <th className="px-3 py-3 text-left">Tx Hash</th>
                        <th className="px-3 py-3 text-left">Amount</th>
                        <th className="px-3 py-3 text-left">Cashback</th>
                        <th className="px-3 py-3 text-left">Status</th>
                        <th className="px-3 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCashbackClaims
                        .slice((claimsPage - 1) * CLAIMS_PAGE_SIZE, claimsPage * CLAIMS_PAGE_SIZE)
                        .map((claim: any) => (
                          <tr key={claim.id} className="border-t border-white/10">
                            <td className="px-3 py-3 break-all text-slate-100">{claim.wallet}</td>
                            <td className="px-3 py-3 break-all text-slate-400">{claim.txHash || "-"}</td>
                            <td className="px-3 py-3 text-slate-100">{claim.amount}</td>
                            <td className="px-3 py-3 text-cyan-100">{FIXED_CASHBACK_LABEL}</td>
                            <td className="px-3 py-3 capitalize text-slate-100">{claim.status}</td>
                            <td className="px-3 py-3">
                              {claim.status === "pending" ? (
                                <button
                                  className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 sm:text-sm"
                                  disabled={marking === claim.id}
                                  onClick={() => distributeCashback(claim)}
                                >
                                  {marking === claim.id ? "Distributing..." : `Distribute ${FIXED_CASHBACK_LABEL} EPWX`}
                                </button>
                              ) : (
                                <span className="font-semibold text-emerald-200">Paid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-center gap-3">
                  <button className={paginationBtnClass} disabled={claimsPage === 1} onClick={() => setClaimsPage((p) => Math.max(1, p - 1))}>Prev</button>
                  <span className="text-sm font-semibold text-slate-300">Page {claimsPage}</span>
                  <button className={paginationBtnClass} disabled={claimsPage * CLAIMS_PAGE_SIZE >= filteredCashbackClaims.length} onClick={() => setClaimsPage((p) => p + 1)}>Next</button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className={pageShellClass}>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white">Admin: Daily EPWX Claims</h2>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Filter by wallet"
                className={filterInputClass}
                value={dailyClaimsFilter.wallet}
                onChange={e => setDailyClaimsFilter((f) => ({ ...f, wallet: e.target.value }))}
              />
              <select
                className={filterSelectClass}
                value={dailyClaimsFilter.status}
                onChange={e => setDailyClaimsFilter((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="mt-4">
              <DailyClaimsTable
                claims={filteredDailyClaims.slice((dailyClaimsPage - 1) * DAILY_CLAIMS_PAGE_SIZE, dailyClaimsPage * DAILY_CLAIMS_PAGE_SIZE)}
                isAdmin={true}
                onDistribute={distributeDailyClaim}
                marking={marking}
              />
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
              <button className={paginationBtnClass} disabled={dailyClaimsPage === 1} onClick={() => setDailyClaimsPage((p) => Math.max(1, p - 1))}>Prev</button>
              <span className="text-sm font-semibold text-slate-300">Page {dailyClaimsPage}</span>
              <button className={paginationBtnClass} disabled={dailyClaimsPage * DAILY_CLAIMS_PAGE_SIZE >= filteredDailyClaims.length} onClick={() => setDailyClaimsPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      </main>
    </div>
  );
}
