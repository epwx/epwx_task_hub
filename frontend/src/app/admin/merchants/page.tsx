
"use client";
import { useState, useEffect } from "react";
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
  const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
    .split(",")
    .map(w => w.trim().toLowerCase())
    .filter(Boolean);

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
        body: JSON.stringify({ admin: address, claimId: claim.id, txHash: tx }),
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
                  {paginatedMerchants.map((m) => {
                    // Construct the merchant claim URL for QR code
                    const merchantUrl = `https://tasks.epowex.com/claim?merchant=${m.id}`;
                    return (
                      <div key={String(m.id)} className="bg-white rounded shadow p-4 border flex flex-col text-sm text-gray-800">
                        <div className="font-bold text-lg mb-2 text-gray-900">{m.name}</div>
                        <div><span className="font-semibold text-gray-700">Wallet:</span> <span className="break-all text-gray-800">{m.wallet}</span></div>
                        <div><span className="font-semibold text-gray-700">Address:</span> <span className="text-gray-800">{m.address}</span></div>
                        <div><span className="font-semibold text-gray-700">Latitude:</span> <span className="text-gray-800">{m.latitude}</span></div>
                        <div><span className="font-semibold text-gray-700">Longitude:</span> <span className="text-gray-800">{m.longitude}</span></div>
                        {/* QR Code for merchant */}
                        <div className="mt-4">
                          <MerchantQRCode url={merchantUrl} merchantName={m.name} merchantAddress={m.address} />
                        </div>
                        <div className="flex flex-row gap-2 mt-2">
                          <button className="text-blue-600 underline self-start" onClick={() => toggleClaims(m.id)}>
                            {expanded[m.id] ? "Hide Claims" : "View Claims"}
                          </button>
                          <button className="text-green-600 underline self-start" onClick={() => openEditModal(m)}>
                            Edit
                          </button>
                        </div>
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
                                        onReject={rejectClaim}
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
                    );
                  })}
                        {/* Edit Merchant Modal */}
                        {editState.open && (
                          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                            <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
                              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={closeEditModal}>&times;</button>
                              <h3 className="text-lg font-bold mb-4">Edit Merchant</h3>
                              <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                  <label className="block text-gray-700 text-sm font-semibold mb-1">Merchant ID</label>
                                  <input value={editState.merchant?.id || ''} readOnly className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-100 cursor-not-allowed" />
                                </div>
                                <input name="name" value={editState.form.name} onChange={handleEditChange} placeholder="Merchant Name" className="w-full border rounded px-3 py-2 text-gray-700" required />
                                <input name="wallet" value={editState.form.wallet} onChange={handleEditChange} placeholder="Merchant Wallet Address (optional)" className="w-full border rounded px-3 py-2 text-gray-700" />
                                <input name="address" value={editState.form.address} onChange={handleEditChange} placeholder="Shop Address" className="w-full border rounded px-3 py-2 text-gray-700" required />
                                <input name="latitude" value={editState.form.latitude} onChange={handleEditChange} placeholder="Latitude" className="w-full border rounded px-3 py-2 text-gray-700" required type="text" />
                                <input name="longitude" value={editState.form.longitude} onChange={handleEditChange} placeholder="Longitude" className="w-full border rounded px-3 py-2 text-gray-700" required type="text" />
                                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-semibold" disabled={editState.loading}>{editState.loading ? "Saving..." : "Save Changes"}</button>
                                {editState.error && <div className="text-red-600 mt-2">{editState.error}</div>}
                              </form>
                            </div>
                          </div>
                        )}
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
