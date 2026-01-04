"use client";

import { useEffect, useState } from "react";

const ADMIN_WALLET = "0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735";

export default function AdminPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/epwx/claims?admin=${ADMIN_WALLET}`)
      .then((res) => res.json())
      .then((data) => {
        setClaims(data.claims || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const markPaid = async (claimId: number) => {
    setMarking(claimId);
    setError(null);
    try {
      const res = await fetch("/api/epwx/claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: ADMIN_WALLET, claimId }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims((prev) =>
          prev.map((c: any) => (c.id === claimId ? { ...c, status: "paid" } : c))
        );
      } else {
        setError(data.error || "Failed to mark as paid");
      }
    } catch (e) {
      setError("Failed to mark as paid");
    }
    setMarking(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Admin: Cashback Claims</h1>
      {loading ? (
        <div>Loading claims...</div>
      ) : (
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4">Wallet</th>
              <th className="py-2 px-4">Tx Hash</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Cashback</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim: any) => (
              <tr key={claim.id}>
                <td className="py-2 px-4">{claim.wallet}</td>
                <td className="py-2 px-4">{claim.txHash}</td>
                <td className="py-2 px-4">{claim.amount}</td>
                <td className="py-2 px-4">{claim.cashbackAmount}</td>
                <td className="py-2 px-4">{claim.status}</td>
                <td className="py-2 px-4">
                  {claim.status === "pending" ? (
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      disabled={marking === claim.id}
                      onClick={() => markPaid(claim.id)}
                    >
                      {marking === claim.id ? "Marking..." : "Mark as Paid"}
                    </button>
                  ) : (
                    <span className="text-green-600">Paid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
