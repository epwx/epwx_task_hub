"use client";
import { useEffect, useState } from "react";

type Claim = {
  id: number;
  merchantId: number;
  customer: string;
  bill: string;
  status: string;
  // add other fields if needed
};
import { useAccount, useSignMessage } from "wagmi";
import { adminAuthorizedFetch, createAdminClaimAuthorization } from "@/utils/signedAuthorization";

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
  .split(",")
  .map(w => w.trim().toLowerCase())
  .filter(Boolean);

export default function AdminClaimsPage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!address || !ADMIN_WALLETS.includes(address.toLowerCase())) return;
    setLoading(true);
    adminAuthorizedFetch({
      url: `/api/claims?admin=${address}&status=${statusFilter}`,
      wallet: address,
      signMessage: signMessageAsync,
    })
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch claims");
        setLoading(false);
      });
  }, [address, signMessageAsync, statusFilter]);


  const updateStatus = async (id: number, status: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!address) return;
      const authorization = await createAdminClaimAuthorization({
        wallet: address,
        claimId: id,
        action: "mark-status",
        status,
        signMessage: signMessageAsync,
      });
      const res = await fetch(`/api/claims/${id}/mark-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, authorization }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Claim status updated.");
        setClaims(claims => claims.map(c => c.id === id ? { ...c, status } : c));
      } else {
        setError(data.error || "Failed to update status");
      }
    } catch (e) {
      setError("Failed to update status");
    }
    setLoading(false);
  };

  if (!address || !ADMIN_WALLETS.includes(address.toLowerCase())) {
    return <div className="py-16 text-center text-red-600">Admin wallet required.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Admin Claim Management</h2>
      <div className="mb-4">
        <label>Status Filter: </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
        </select>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Merchant</th>
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Bill</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {claims.map(claim => (
            <tr key={claim.id}>
              <td className="p-2 border">{claim.id}</td>
              <td className="p-2 border">{claim.merchantId}</td>
              <td className="p-2 border">{claim.customer}</td>
              <td className="p-2 border">{claim.bill}</td>
              <td className="p-2 border">{claim.status}</td>
              <td className="p-2 border">
                {claim.status === "pending" && (
                  <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => updateStatus(claim.id, "sent")}>Mark as Sent</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
