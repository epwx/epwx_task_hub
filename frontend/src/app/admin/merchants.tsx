"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";


const getAdminWallets = () => {
  if (typeof window !== "undefined") {
    const env = process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
    return env.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
  }
  return [];
};

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
    const adminWallets = getAdminWallets();
    if (address && adminWallets.includes(address.toLowerCase())) {
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

  const adminWallets = getAdminWallets();
  if (!address || !adminWallets.includes(address.toLowerCase())) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 text-lg text-gray-700 font-semibold">Please connect the admin wallet to access this page.</div>
        <ConnectKitButton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Merchant Onboarding (Admin Only)</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Merchant Name" className="w-full border rounded px-3 py-2" required />
        <input name="wallet" value={form.wallet} onChange={handleChange} placeholder="Merchant Wallet Address" className="w-full border rounded px-3 py-2" required />
        <input name="address" value={form.address} onChange={handleChange} placeholder="Shop Address" className="w-full border rounded px-3 py-2" required />
        <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude" className="w-full border rounded px-3 py-2" required type="number" step="any" />
        <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude" className="w-full border rounded px-3 py-2" required type="number" step="any" />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold" disabled={loading}>{loading ? "Adding..." : "Add Merchant"}</button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </form>
      <h3 className="text-xl font-bold mt-8 mb-2">All Merchants</h3>
      {loading ? <div>Loading...</div> : (
        <table className="w-full border mt-2 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Wallet</th>
              <th className="p-2">Address</th>
              <th className="p-2">Longitude</th>
              <th className="p-2">Latitude</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2">{m.name}</td>
                <td className="p-2">{m.wallet}</td>
                <td className="p-2">{m.address}</td>
                <td className="p-2">{m.longitude}</td>
                <td className="p-2">{m.latitude}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
