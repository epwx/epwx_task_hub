"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Earning {
  id: string;
  partnerId: string;
  userId: string;
  referralId: string;
  claimDate: string;
  cycleNumber: number;
  amount: string;
  status: "pending" | "completed" | "reversed";
  transactionHash?: string;
  user?: {
    walletAddress?: string;
    username?: string;
  };
}

interface EarningsResponse {
  success: boolean;
  data: Earning[];
  total: number;
  limit: number;
  offset: number;
}

interface PartnerEarningsTableProps {
  partnerId: string;
}

function formatEpwx(value: string | number): string {
  const num = typeof value === "string" ? BigInt(value) : BigInt(value);
  const divisor = BigInt("1000000000"); // 10^9 for 9 decimals
  const wholeEpwx = num / divisor;
  return wholeEpwx.toLocaleString();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "pending":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "reversed":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  }
}

export default function PartnerEarningsTable({
  partnerId,
}: PartnerEarningsTableProps) {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/partners/${partnerId}/earnings?limit=${limit}&offset=${offset}`
        );
        const data: EarningsResponse = await response.json();

        if (data.success) {
          setEarnings(data.data || []);
          setTotal(data.total || 0);
        } else {
          toast.error("Failed to load earnings");
        }
      } catch (error) {
        console.error("Error fetching earnings:", error);
        toast.error("An error occurred while loading earnings");
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [partnerId, offset, limit]);

  const hasMore = offset + limit < total;
  const hasPrevious = offset > 0;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur">
      <div className="border-b border-white/10 px-6 py-4">
        <h3 className="font-semibold text-white">Recent Earnings</h3>
        <p className="mt-1 text-xs text-slate-400">
          Showing {earnings.length} of {total} earnings
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
            <p className="text-slate-400">Loading earnings...</p>
          </div>
        </div>
      ) : earnings.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-slate-400">No earnings yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Share your referral links to start earning
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                    Cycle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                    User
                  </th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earning) => (
                  <tr
                    key={earning.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {formatDate(earning.claimDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {earning.cycleNumber}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-cyan-400">
                      {formatEpwx(earning.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(
                          earning.status
                        )}`}
                      >
                        {earning.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {earning.user?.username || "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="block space-y-3 p-4 sm:hidden">
            {earnings.map((earning) => (
              <div
                key={earning.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {formatEpwx(earning.amount)} EPWX
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(earning.claimDate)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(
                      earning.status
                    )}`}
                  >
                    {earning.status}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  <p>Cycle: {earning.cycleNumber}</p>
                  <p>User: {earning.user?.username || "Unknown"}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={!hasPrevious}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-xs text-slate-400">
              Page {Math.floor(offset / limit) + 1} of{" "}
              {Math.ceil(total / limit)}
            </p>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={!hasMore}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
