
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useWalletClient, useWriteContract, useAccount } from "wagmi";
import { ethers } from "ethers";
import { ConnectKitButton } from "connectkit";
import MerchantClaimsTable from "@/components/MerchantClaimsTable";
import MerchantQRCode from "@/components/MerchantQRCode";


  // ...existing code...


  // ...existing code...



// Edit modal state type
type EditMerchantState = {
  open: boolean;
  merchant: any | null;
  form: { name: string; wallet: string; address: string; latitude: string; longitude: string };
  error: string | null;
  loading: boolean;
};


export default function MerchantAdminPage() {

  // ...existing hooks and state...


  // ...existing hooks and state...

  // ...other functions...

  // Handle claim rejection with comment (must be after all hooks)
  const rejectClaim = async (claim: any, rejectionComment: string) => {
    setMarking(claim.id);
    setClaimsError(cl => ({ ...cl, [claim.merchantId]: null }));
    try {
      if (!address || !ADMIN_WALLETS.includes(address.toLowerCase())) {
        setClaimsError(cl => ({ ...cl, [claim.merchantId]: "Admin wallet not connected" }));
        setMarking(null);
        return;
      }
      const res = await fetch(`/api/claims/${claim.id}/mark-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, status: "rejected", rejectionComment }),
      });
      const data = await res.json();
      if (data.success) {
        // Refetch claims for this merchant after rejection
        try {
          const res = await fetch(`/api/claims?merchantId=${claim.merchantId}`);
          const data = await res.json();
          setClaims(claims => ({ ...claims, [claim.merchantId]: data.claims || [] }));
        } catch (e) {}
        setClaimsError(cl => ({ ...cl, [claim.merchantId]: null }));
      } else {
        setClaimsError(cl => ({ ...cl, [claim.merchantId]: data.error || "Failed to reject claim" }));
      }
    } catch (e: any) {
      setClaimsError(cl => ({ ...cl, [claim.merchantId]: e?.message || "Failed to reject claim" }));
    }
    setMarking(null);
  };

  // Use connected wallet address
  const { address } = useAccount();
  const ADMIN_WALLETS = useMemo(() => {
    return (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
      .split(",")
      .map(w => w.trim().toLowerCase())
      .filter(Boolean);
  }, []);
  const isAdmin = useMemo(() => {
    return !!address && ADMIN_WALLETS.includes(address.toLowerCase());
  }, [address, ADMIN_WALLETS]);

  const [form, setForm] = useState({ name: "", wallet: "", address: "", latitude: "", longitude: "" });
  const [merchants, setMerchants] = useState<any[]>([]);
  const [paginatedMerchants, setPaginatedMerchants] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [claims, setClaims] = useState<{ [key: number]: any[] }>({});
  const [claimsLoading, setClaimsLoading] = useState<{ [key: number]: boolean }>({});
  const [claimsError, setClaimsError] = useState<{ [key: number]: string | null }>({});
  const [editState, setEditState] = useState<EditMerchantState>({
    open: false,
    merchant: null,
    form: { name: "", wallet: "", address: "", latitude: "", longitude: "" },
    error: null,
    loading: false,
  });
  const [merchantPage, setMerchantPage] = useState(1);
  const [merchantPageCount, setMerchantPageCount] = useState(1);
  const [claimsPage, setClaimsPage] = useState<{ [key: number]: number }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const pageShellClass = "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8";
  const glassPanelClass = "rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-lg";
  const inputClassName = "w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20";

  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const [marking, setMarking] = useState<number | null>(null);

  // Placeholder for paginated merchants (simple passthrough for now)
  useEffect(() => {
    setPaginatedMerchants(merchants);
  }, [merchants]);

  // Placeholder for merchant page count
  useEffect(() => {
    setMerchantPageCount(1);
  }, [merchants]);

  // Placeholder for claims pagination
  const getPaginatedClaims = (merchantId: number) => {
    return claims[merchantId] || [];
  };
  const getClaimsPageCount = (merchantId: number) => {
    return 1;
  };

  // Edit modal handlers
  const openEditModal = (merchant: any) => {
    setEditState({
      open: true,
      merchant,
      form: {
        name: merchant.name || "",
        wallet: merchant.wallet || "",
        address: merchant.address || "",
        latitude: merchant.latitude || "",
        longitude: merchant.longitude || "",
      },
      error: null,
      loading: false,
    });
  };
  const closeEditModal = () => {
    setEditState({
      open: false,
      merchant: null,
      form: { name: "", wallet: "", address: "", latitude: "", longitude: "" },
      error: null,
      loading: false,
    });
  };
  const handleEditChange = (e: any) => {
    setEditState(prev => ({
      ...prev,
      form: { ...prev.form, [e.target.name]: e.target.value },
    }));
  };
  const handleEditSubmit = async (e: any) => {
    e.preventDefault();
    setEditState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/merchants/${editState.merchant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editState.form, admin: address }),
      });
      const data = await res.json();
      if (data.success) {
        setEditState(prev => ({ ...prev, loading: false, open: false }));
        fetchMerchants();
      } else {
        setEditState(prev => ({ ...prev, loading: false, error: data.error || "Failed to update merchant" }));
      }
    } catch (e: any) {
      setEditState(prev => ({ ...prev, loading: false, error: e?.message || "Failed to update merchant" }));
    }
  };

  // Add contract address/ABI (copy from admin page)
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

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/merchants/list?admin=${address}`);
      const data = await res.json();
      setMerchants(data.merchants || []);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch merchants");
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    if (isAdmin) {
      fetchMerchants();
    }
  }, [fetchMerchants, isAdmin]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/merchants/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, admin: address }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Merchant added successfully!");
        setForm({ name: "", wallet: "", address: "", longitude: "", latitude: "" });
        fetchMerchants();
      } else {
        setError(data.error || "Failed to add merchant");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to add merchant");
    }
    setLoading(false);
  }

  const notAdmin = !address || !ADMIN_WALLETS.includes(address.toLowerCase());

  const distributeCashback = async (claim: any) => {
    setMarking(claim.id);
    setClaimsError(cl => ({ ...cl, [claim.merchantId]: null }));
    try {
      if (!address || !ADMIN_WALLETS.includes(address.toLowerCase())) {
        setClaimsError(cl => ({ ...cl, [claim.merchantId]: "Admin wallet not connected" }));
        setMarking(null);
        return;
      }
      // You may need to fetch the correct cashback amount for the claim
      let cashbackAmount = claim.cashbackAmount || claim.amount || claim.bill;
      if (!cashbackAmount || Number(cashbackAmount) === 0) cashbackAmount = "100000";
      const roundedAmount = Number(cashbackAmount).toFixed(9);
      const amount = ethers.parseUnits(roundedAmount, 9).toString();
      const tx = await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [claim.customer, amount],
      });
      // Wait for transaction confirmation
      if (tx) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.waitForTransaction(tx);
      }
      // Mark as paid in backend, include tx hash
      const res = await fetch("/api/epwx/claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, claimId: claim.id, txHash: tx, claimSource: "claim" }),
      });
      const data = await res.json();
      if (data.success) {
        // Always refetch claims for this merchant after distribution
        try {
          const res = await fetch(`/api/claims?merchantId=${claim.merchantId}`);
          const data = await res.json();
          console.log('[claims refetch after distribute]', data.claims);
          setClaims(claims => ({ ...claims, [claim.merchantId]: data.claims || [] }));
        } catch (e) {
          console.error('[claims refetch error]', e);
        }
        setClaimsError(cl => ({ ...cl, [claim.merchantId]: null }));
      } else {
        // Fallback: refetch claims for this merchant
        try {
          const res = await fetch(`/api/claims?merchantId=${claim.merchantId}`);
          const data = await res.json();
          setClaims(claims => ({ ...claims, [claim.merchantId]: data.claims || [] }));
        } catch {}
        setClaimsError(cl => ({ ...cl, [claim.merchantId]: data.error || "Failed to mark as paid" }));
      }
    } catch (e: any) {
      setClaimsError(cl => ({ ...cl, [claim.merchantId]: e?.message || "Failed to distribute cashback" }));
    }
    setMarking(null);
  };

  const toggleClaims = async (merchantId: number) => {
    setExpanded(exp => ({ ...exp, [merchantId]: !exp[merchantId] }));
    if (!claims[merchantId] && !claimsLoading[merchantId]) {
      setClaimsLoading(cl => ({ ...cl, [merchantId]: true }));
      setClaimsError(cl => ({ ...cl, [merchantId]: null }));
      try {
        const res = await fetch(`/api/claims?merchantId=${merchantId}`);
        const data = await res.json();
        setClaims(cl => ({ ...cl, [merchantId]: data.claims || [] }));
      } catch (e: any) {
        setClaimsError(cl => ({ ...cl, [merchantId]: e?.message || "Failed to fetch claims" }));
      }
      setClaimsLoading(cl => ({ ...cl, [merchantId]: false }));
    }
  };
  // Component render starts here
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-cyan-500/12 blur-[90px] sm:-left-32 sm:h-80 sm:w-80 sm:blur-[130px]" />
        <div className="absolute -right-16 top-20 h-64 w-64 rounded-full bg-blue-600/16 blur-[100px] sm:-right-28 sm:h-96 sm:w-96 sm:blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 h-44 w-[20rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[90px] sm:h-72 sm:w-[38rem] sm:blur-[150px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl min-w-0">
      {notAdmin ? (
        <div className="mx-auto max-w-2xl py-16">
          <div className={`${pageShellClass} text-center`}>
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Admin Access</div>
              <div className="mt-2 text-2xl font-black text-white">Connect the admin wallet</div>
              <div className="mt-3 mb-6 max-w-lg text-sm text-slate-300">This page manages merchant onboarding, merchant QR distribution, and reward-claim reviews. Connect an approved admin wallet to continue.</div>
              <ConnectKitButton />
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className={`${pageShellClass} mb-6`}>
            <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative z-10 flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Merchant Admin</div>
                <h2 className="mt-2 text-3xl font-black text-white">Merchant onboarding and claims</h2>
                <p className="mt-3 max-w-2xl text-sm text-slate-300">Register merchant locations, generate claim QR codes, and review receipt-based cashback claims from one admin surface.</p>
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Merchants</div>
                  <div className="mt-2 text-2xl font-black text-white">{merchants.length}</div>
                </div>
                <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Expanded</div>
                  <div className="mt-2 text-2xl font-black text-cyan-200">{Object.values(expanded).filter(Boolean).length}</div>
                </div>
                <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Wallet</div>
                  <div className="mt-2 break-all text-sm font-bold text-emerald-200">{address}</div>
                </div>
              </div>
            </div>
          </section>
          <form onSubmit={e => {
            e.preventDefault();
            // Validate latitude and longitude
            const lat = parseFloat(form.latitude);
            const lng = parseFloat(form.longitude);
            if (isNaN(lat) || isNaN(lng)) {
              setError("Latitude and Longitude must be valid numbers.");
              return;
            }
            setError(null);
            handleSubmit(e);
          }} className={`${pageShellClass} space-y-5`}>
            <div className="relative z-10">
              <div className="mb-5 border-b border-white/10 pb-4">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Onboarding</div>
                <div className="mt-2 text-2xl font-black text-white">Add merchant</div>
                <div className="mt-2 text-sm text-slate-300">Create a claim endpoint tied to a merchant location and optional payout wallet.</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="name" value={form.name} onChange={handleChange} placeholder="Merchant Name" className={inputClassName} required />
                <input name="wallet" value={form.wallet} onChange={handleChange} placeholder="Merchant Wallet Address (optional)" className={inputClassName} />
                <input name="address" value={form.address} onChange={handleChange} placeholder="Shop Address" className={`${inputClassName} md:col-span-2`} required />
                <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude" className={inputClassName} required type="text" />
                <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude" className={inputClassName} required type="text" />
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="submit" className="ui-btn-primary rounded-2xl px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>{loading ? "Adding..." : "Add Merchant"}</button>
                <div className="text-xs text-slate-400">Coordinates are used to enforce the 50m proximity check on merchant receipt claims.</div>
              </div>
              {error && <div className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
              {success && <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{success}</div>}
            </div>
          </form>
          <div className="mt-8 mb-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">Merchant Directory</div>
          <h3 className="text-2xl font-black text-white">All merchants</h3>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-4 mt-2">
              {Array.isArray(merchants) && merchants.length > 0 ? (
                <>
                  {paginatedMerchants.map((m) => {
                    // Construct the merchant claim URL for QR code
                    const merchantUrl = `https://tasks.epowex.com/claim?merchant=${m.id}`;
                    return (
                      <div key={String(m.id)} className={`${pageShellClass} p-5 sm:p-6`}>
                        <div className="relative z-10 flex flex-col gap-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Merchant #{m.id}</div>
                              <div className="mt-2 text-2xl font-black text-white">{m.name}</div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                              <div className={`${glassPanelClass} px-4 py-3`}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Latitude</div>
                                <div className="mt-2 text-sm font-bold text-cyan-200">{m.latitude}</div>
                              </div>
                              <div className={`${glassPanelClass} px-4 py-3`}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Longitude</div>
                                <div className="mt-2 text-sm font-bold text-cyan-200">{m.longitude}</div>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
                            <div className="space-y-3">
                              <div className={`${glassPanelClass} px-4 py-3 text-sm text-slate-200`}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Wallet</div>
                                <div className="mt-2 break-all font-semibold text-white">{m.wallet || "Not set"}</div>
                              </div>
                              <div className={`${glassPanelClass} px-4 py-3 text-sm text-slate-200`}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Address</div>
                                <div className="mt-2 font-semibold text-white">{m.address}</div>
                              </div>
                              <div className="flex flex-wrap gap-3 pt-1">
                                <button className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20" onClick={() => toggleClaims(m.id)}>
                                  {expanded[m.id] ? "Hide Claims" : "View Claims"}
                                </button>
                                <button className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-100 transition-colors hover:bg-emerald-400/20" onClick={() => openEditModal(m)}>
                                  Edit Merchant
                                </button>
                              </div>
                            </div>
                            <MerchantQRCode url={merchantUrl} merchantName={m.name} merchantAddress={m.address} />
                          </div>
                        {expanded[m.id] && (
                            <div className={`${glassPanelClass} mt-1 w-full p-4`}>
                              {claimsLoading[m.id] ? (
                                <div className="text-sm text-slate-300">Loading claims...</div>
                              ) : (
                                <>
                                  {claimsError[m.id] && (
                                    <div className="mb-3 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{claimsError[m.id]}</div>
                                  )}
                                  {Array.isArray(claims[m.id]) && claims[m.id].length > 0 ? (
                                    <>
                                      <MerchantClaimsTable
                                        claims={getPaginatedClaims(m.id)}
                                        isAdmin={!!(address && ADMIN_WALLETS.includes(address.toLowerCase()))}
                                        onDistribute={distributeCashback}
                                        onReject={rejectClaim}
                                        marking={marking}
                                      />
                                      <div className="mt-3 flex items-center justify-end gap-2 text-sm text-slate-300">
                                        <button
                                          className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 transition-colors hover:bg-white/15 disabled:opacity-40"
                                          disabled={(claimsPage[m.id] || 1) === 1}
                                          onClick={() => setClaimsPage(cp => ({ ...cp, [m.id]: (cp[m.id] || 1) - 1 }))}
                                        >Previous</button>
                                        <span>Page {(claimsPage[m.id] || 1)} of {getClaimsPageCount(m.id)}</span>
                                        <button
                                          className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 transition-colors hover:bg-white/15 disabled:opacity-40"
                                          disabled={(claimsPage[m.id] || 1) === getClaimsPageCount(m.id)}
                                          onClick={() => setClaimsPage(cp => ({ ...cp, [m.id]: (cp[m.id] || 1) + 1 }))}
                                        >Next</button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-sm text-slate-300">No claims for this merchant.</div>
                                  )}
                                </>
                              )}
                            </div>
                        )}
                        </div>
                      </div>
                    );
                  })}
                        {/* Edit Merchant Modal */}
                        {editState.open && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
                            <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl">
                              <button className="absolute right-4 top-3 text-2xl font-bold text-white/55 hover:text-white" onClick={closeEditModal}>&times;</button>
                              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Merchant Editor</div>
                              <h3 className="mt-2 text-2xl font-black text-white">Edit Merchant</h3>
                              <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                  <label className="mb-1 block text-sm font-semibold text-slate-300">Merchant ID</label>
                                  <input value={editState.merchant?.id || ''} readOnly className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300" />
                                </div>
                                <input name="name" value={editState.form.name} onChange={handleEditChange} placeholder="Merchant Name" className={inputClassName} required />
                                <input name="wallet" value={editState.form.wallet} onChange={handleEditChange} placeholder="Merchant Wallet Address (optional)" className={inputClassName} />
                                <input name="address" value={editState.form.address} onChange={handleEditChange} placeholder="Shop Address" className={inputClassName} required />
                                <input name="latitude" value={editState.form.latitude} onChange={handleEditChange} placeholder="Latitude" className={inputClassName} required type="text" />
                                <input name="longitude" value={editState.form.longitude} onChange={handleEditChange} placeholder="Longitude" className={inputClassName} required type="text" />
                                <button type="submit" className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60" disabled={editState.loading}>{editState.loading ? "Saving..." : "Save Changes"}</button>
                                {editState.error && <div className="mt-2 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{editState.error}</div>}
                              </form>
                            </div>
                          </div>
                        )}
                  <div className="mt-4 flex items-center justify-end gap-2 text-sm text-slate-300">
                    <button
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 transition-colors hover:bg-white/15 disabled:opacity-40"
                      disabled={merchantPage === 1}
                      onClick={() => setMerchantPage(merchantPage - 1)}
                    >Previous</button>
                    <span>Page {merchantPage} of {merchantPageCount}</span>
                    <button
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 transition-colors hover:bg-white/15 disabled:opacity-40"
                      disabled={merchantPage === merchantPageCount}
                      onClick={() => setMerchantPage(merchantPage + 1)}
                    >Next</button>
                  </div>
                </>
              ) : (
                <div className={`${glassPanelClass} px-4 py-5 text-sm text-slate-300`}>No merchants found.</div>
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
