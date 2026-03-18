"use client";
import { useEffect, useState } from "react";

type Claim = {
  id: number;
  merchantId: number;
  customer: string;
  bill: string;
  status: string;
  rejectionComment?: string;
  // add other fields if needed
};
import { useAccount } from "wagmi";

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
  .split(",")
  .map(w => w.trim().toLowerCase())
  .filter(Boolean);

export default function AdminClaimsPage() {
  const { address } = useAccount();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!address || !ADMIN_WALLETS.includes(address.toLowerCase())) return;
    setLoading(true);
    fetch(`/api/claims?admin=${address}&status=${statusFilter}`)
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch claims");
        setLoading(false);
      });
  }, [address, statusFilter]);

  const [rejectingId, setRejectingId] = useState<number|null>(null);
  const [rejectionComment, setRejectionComment] = useState("");

  const updateStatus = async (id: number, status: string, rejectionComment?: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const body: any = { admin: address, status };
      if (status === "rejected") body.rejectionComment = rejectionComment;
      const res = await fetch(`/api/claims/${id}/mark-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Claim status updated.");
        setClaims(claims => claims.map(c => c.id === id ? { ...c, status, rejectionComment: status === "rejected" ? rejectionComment : undefined } : c));
        setRejectingId(null);
        setRejectionComment("");
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
              <td className="p-2 border capitalize">{claim.status}
                {claim.status === "rejected" && claim.rejectionComment && (
                  <div className="text-xs text-red-600 mt-1">Reason: {claim.rejectionComment}</div>
                )}
              </td>
              <td className="p-2 border">
                {claim.status === "pending" && (
                  <div className="flex flex-col gap-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => updateStatus(claim.id, "sent")}>Mark as Sent</button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => setRejectingId(claim.id)}>Reject</button>
                    {rejectingId === claim.id && (
                      <div className="mt-2 flex flex-col gap-1">
                        <textarea
                          className="border rounded p-1 text-xs"
                          rows={2}
                          placeholder="Enter rejection reason..."
                          value={rejectionComment}
                          onChange={e => setRejectionComment(e.target.value)}
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            className="bg-red-700 text-white px-2 py-1 rounded text-xs"
                            disabled={!rejectionComment.trim()}
                            onClick={() => updateStatus(claim.id, "rejected", rejectionComment)}
                          >
                            Confirm Reject
                          </button>
                          <button
                            className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs"
                            onClick={() => { setRejectingId(null); setRejectionComment(""); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
