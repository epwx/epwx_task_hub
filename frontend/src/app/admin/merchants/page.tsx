"use client";
import { useState, useEffect } from "react";

type Claim = {
  id: number;
  merchantId: number;
  customer: string;
  bill: string;
  status: string;
  createdAt: string;
};
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

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
  };

  useEffect(() => {
    if (address && ADMIN_WALLETS.includes(address.toLowerCase())) {
      fetchMerchants();
    }
  }, [address]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
  };

  if (!address || !ADMIN_WALLETS.includes(address.toLowerCase())) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 text-lg text-gray-700 font-semibold">Please connect the admin wallet to access this page.</div>
        <ConnectKitButton />
      </div>
    );
  }

  // Track which merchant's claims are expanded and their claims
  // Debug: Log merchants and claims to catch undefined/null
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('DEBUG merchants:', merchants);
      // eslint-disable-next-line no-console
      console.log('DEBUG claims:', claims);
    }
  }, [merchants, claims]);
  const [expanded, setExpanded] = useState<{ [merchantId: number]: boolean }>({});
  const [claims, setClaims] = useState<{ [merchantId: number]: Claim[] }>({});
  const [claimsLoading, setClaimsLoading] = useState<{ [merchantId: number]: boolean }>({});
  const [claimsError, setClaimsError] = useState<{ [merchantId: number]: string | null }>({});

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
          {Array.isArray(merchants) && merchants.filter(m => m && typeof m === 'object' && m.id != null).map((m) => (
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
                  {claimsLoading[m.id] ? <div>Loading claims...</div> :
                    claimsError[m.id] ? <div className="text-red-600">{claimsError[m.id]}</div> :
                    (Array.isArray(claims[m.id]) && claims[m.id].length > 0 ? (
                      <table className="w-full border mt-2 text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-1 border">ID</th>
                            <th className="p-1 border">Customer</th>
                            <th className="p-1 border">Bill</th>
                            <th className="p-1 border">Status</th>
                            <th className="p-1 border">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(claims[m.id]) && claims[m.id].filter(claim => claim && claim.id != null).map(claim => (
                            <tr key={String(claim.id)}>
                              <td className="p-1 border">{claim.id}</td>
                              <td className="p-1 border">{claim.customer}</td>
                              <td className="p-1 border">{claim.bill}</td>
                              <td className="p-1 border">{claim.status}</td>
                              <td className="p-1 border">{new Date(claim.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <div className="text-gray-600">No claims for this merchant.</div>)}}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
