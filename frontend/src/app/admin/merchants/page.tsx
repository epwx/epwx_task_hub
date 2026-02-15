"use client";
import { useState, useEffect } from "react";

import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useWalletClient, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import MerchantClaimsTable from "@/components/MerchantClaimsTable";

type Claim = {
  id: number;
  merchantId: number;
  customer: string;
  bill: string;
  status: string;
  createdAt: string;
  cashbackAmount?: string;
};

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
  .split(",")
  .map(w => w.trim().toLowerCase())
  .filter(Boolean);

export default function MerchantAdminPage() {
  const { address } = useAccount();
  const [form, setForm] = useState({ name: "", wallet: "", address: "", longitude: "", latitude: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<any[]>([]);
  // Track which merchant's claims are expanded and their claims
  const [expanded, setExpanded] = useState<{ [merchantId: number]: boolean }>({});
  const [claims, setClaims] = useState<{ [merchantId: number]: Claim[] }>({});
  const [claimsLoading, setClaimsLoading] = useState<{ [merchantId: number]: boolean }>({});
  const [claimsError, setClaimsError] = useState<{ [merchantId: number]: string | null }>({});

  // Pagination state for merchants
  const [merchantPage, setMerchantPage] = useState(1);
  const merchantsPerPage = 5;
  const paginatedMerchants = Array.isArray(merchants)
    ? merchants.filter(m => m && typeof m === 'object' && m.id != null).slice((merchantPage - 1) * merchantsPerPage, merchantPage * merchantsPerPage)
    : [];
  const merchantPageCount = Array.isArray(merchants)
    ? Math.ceil(merchants.filter(m => m && typeof m === 'object' && m.id != null).length / merchantsPerPage)
    : 1;

  // Pagination state for claims per merchant
  const [claimsPage, setClaimsPage] = useState<{ [merchantId: number]: number }>({});
  const claimsPerPage = 5;
  const getPaginatedClaims = (merchantId: number) => {
    const allClaims = Array.isArray(claims[merchantId]) ? claims[merchantId].filter(claim => claim && claim.id != null) : [];
    const page = claimsPage[merchantId] || 1;
    return allClaims.slice((page - 1) * claimsPerPage, page * claimsPerPage);
  };
  const getClaimsPageCount = (merchantId: number) => {
    const allClaims = Array.isArray(claims[merchantId]) ? claims[merchantId].filter(claim => claim && claim.id != null) : [];
    return Math.ceil(allClaims.length / claimsPerPage) || 1;
  };

  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const [marking, setMarking] = useState<number | null>(null);

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

  const fetchMerchants = async () => {
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
  }

  useEffect(() => {
    if (address && ADMIN_WALLETS.includes(address.toLowerCase())) {
      fetchMerchants();
    }
  }, [address]);

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
      const cashbackAmount = claim.cashbackAmount || claim.amount || claim.bill || "0";
      const roundedAmount = Number(cashbackAmount).toFixed(9);
      const amount = ethers.parseUnits(roundedAmount, 9).toString();
      await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [claim.customer, amount],
      });
      // Mark as paid in backend
      const res = await fetch("/api/epwx/claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, claimId: claim.id }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update status to paid
        setClaims(claims => ({
          ...claims,
          [claim.merchantId]: (claims[claim.merchantId] || []).map((c: any) => c.id === claim.id ? { ...c, status: "paid" } : c)
        }));
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

  return (
    <div className="max-w-2xl mx-auto py-8">
      {notAdmin ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-lg text-gray-700 font-semibold">Please connect the admin wallet to access this page.</div>
          <ConnectKitButton />
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4">Merchant Onboarding (Admin Only)</h2>
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
          }} className="space-y-4 bg-white p-6 rounded shadow">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Merchant Name" className="w-full border rounded px-3 py-2 text-gray-700" required />
            <input name="wallet" value={form.wallet} onChange={handleChange} placeholder="Merchant Wallet Address (optional)" className="w-full border rounded px-3 py-2 text-gray-700" />
            <input name="address" value={form.address} onChange={handleChange} placeholder="Shop Address" className="w-full border rounded px-3 py-2 text-gray-700" required />
            <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude" className="w-full border rounded px-3 py-2 text-gray-700" required type="text" />
            <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude" className="w-full border rounded px-3 py-2 text-gray-700" required type="text" />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold" disabled={loading}>{loading ? "Adding..." : "Add Merchant"}</button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {success && <div className="text-green-600 mt-2">{success}</div>}
          </form>
          <h3 className="text-xl font-bold mt-8 mb-2">All Merchants</h3>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-4 mt-2">
              {Array.isArray(merchants) && merchants.length > 0 ? (
                <>
                  {paginatedMerchants.map((m) => (
                    <div key={String(m.id)} className="bg-white rounded shadow p-4 border flex flex-col text-sm text-gray-800">
                      <div className="font-bold text-lg mb-2 text-gray-900">{m.name}</div>
                      <div><span className="font-semibold text-gray-700">Wallet:</span> <span className="break-all text-gray-800">{m.wallet}</span></div>
                      <div><span className="font-semibold text-gray-700">Address:</span> <span className="text-gray-800">{m.address}</span></div>
                      <div><span className="font-semibold text-gray-700">Latitude:</span> <span className="text-gray-800">{m.latitude}</span></div>
                      <div><span className="font-semibold text-gray-700">Longitude:</span> <span className="text-gray-800">{m.longitude}</span></div>
                      <button className="mt-2 text-blue-600 underline self-start" onClick={() => toggleClaims(m.id)}>
                        {expanded[m.id] ? "Hide Claims" : "View Claims"}
                      </button>
                      {expanded[m.id] && (
                          <div className="mt-2 w-full">
                            {claimsLoading[m.id] ? (
                              <div>Loading claims...</div>
                            ) : (
                              <>
                                {claimsError[m.id] && (
                                  <div className="text-red-600 mb-2">{claimsError[m.id]}</div>
                                )}
                                {Array.isArray(claims[m.id]) && claims[m.id].length > 0 ? (
                                  <>
                                    <MerchantClaimsTable
                                      claims={getPaginatedClaims(m.id)}
                                      isAdmin={!!(address && ADMIN_WALLETS.includes(address.toLowerCase()))}
                                      onDistribute={distributeCashback}
                                      marking={marking}
                                    />
                                    <div className="flex justify-end items-center mt-2 space-x-2">
                                      <button
                                        className="px-2 py-1 border rounded bg-gray-100"
                                        disabled={(claimsPage[m.id] || 1) === 1}
                                        onClick={() => setClaimsPage(cp => ({ ...cp, [m.id]: (cp[m.id] || 1) - 1 }))}
                                      >Previous</button>
                                      <span>Page {(claimsPage[m.id] || 1)} of {getClaimsPageCount(m.id)}</span>
                                      <button
                                        className="px-2 py-1 border rounded bg-gray-100"
                                        disabled={(claimsPage[m.id] || 1) === getClaimsPageCount(m.id)}
                                        onClick={() => setClaimsPage(cp => ({ ...cp, [m.id]: (cp[m.id] || 1) + 1 }))}
                                      >Next</button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-gray-600">No claims for this merchant.</div>
                                )}
                              </>
                            )}
                          </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end items-center mt-4 space-x-2">
                    <button
                      className="px-2 py-1 border rounded bg-gray-100"
                      disabled={merchantPage === 1}
                      onClick={() => setMerchantPage(merchantPage - 1)}
                    >Previous</button>
                    <span>Page {merchantPage} of {merchantPageCount}</span>
                    <button
                      className="px-2 py-1 border rounded bg-gray-100"
                      disabled={merchantPage === merchantPageCount}
                      onClick={() => setMerchantPage(merchantPage + 1)}
                    >Next</button>
                  </div>
                </>
              ) : (
                <div className="text-gray-600">No merchants found.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
