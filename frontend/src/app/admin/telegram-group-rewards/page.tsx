"use client";

import React from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

type GroupOwner = {
  id: string;
  groupId: string;
  groupTitle?: string | null;
  ownerTelegramUserId: string;
  ownerWallet: string;
  status: string;
};

type GroupReward = {
  id: string;
  groupOwnerId: string;
  groupId: string;
  ownerWallet: string;
  claimantWallet: string;
  claimantTelegramUserId: string;
  dailyClaimId: number;
  rewardAmount: string;
  status: "pending" | "paid" | "blocked";
  txHash?: string | null;
  paidAt?: string | null;
  paidByWallet?: string | null;
  reason?: string | null;
  createdAt: string;
  groupOwner?: GroupOwner;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  rewards?: GroupReward[];
};

const getAdminWallets = () => {
  const env = process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
  return env.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
};

export default function TelegramGroupRewardsAdminPage() {
  const { address } = useAccount();
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [rewards, setRewards] = React.useState<GroupReward[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [markingId, setMarkingId] = React.useState<string | null>(null);

  const isAdmin = React.useMemo(() => {
    if (!address) return false;
    return getAdminWallets().includes(address.toLowerCase());
  }, [address]);

  const fetchRewards = React.useCallback(async () => {
    if (!address || !isAdmin) {
      setRewards([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/telegram-miniapp/group-owner/rewards/admin?admin=${encodeURIComponent(address)}&status=${encodeURIComponent(statusFilter)}&limit=200`, {
        cache: "no-store",
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load rewards");
      }
      setRewards(data.rewards || []);
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to load rewards");
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, [address, isAdmin, statusFilter]);

  React.useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const markPaid = async (reward: GroupReward) => {
    if (!address || !isAdmin) {
      setError("Connect admin wallet to mark rewards as paid.");
      return;
    }

    const txHash = window.prompt("Enter payout tx hash for this reward:", reward.txHash || "");
    if (!txHash || !txHash.trim()) {
      return;
    }

    setMarkingId(reward.id);
    setError(null);

    try {
      const res = await fetch(`/api/telegram-miniapp/group-owner/rewards/${encodeURIComponent(reward.id)}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, txHash: txHash.trim() }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string; reward?: GroupReward };
      if (!res.ok || !data.success || !data.reward) {
        throw new Error(data.error || "Failed to mark reward as paid");
      }

      setRewards((current) => current.map((item) => (item.id === reward.id ? data.reward! : item)));
    } catch (markError: any) {
      setError(markError?.message || "Failed to mark reward as paid");
    } finally {
      setMarkingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-black mb-3">Telegram Group Owner Rewards</h1>
        <p className="mb-4 text-slate-600 dark:text-slate-300">Connect an admin wallet to view and settle pending rewards.</p>
        <ConnectKitButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Telegram Group Owner Rewards</h1>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="blocked">Blocked</option>
          </select>
          <button
            type="button"
            onClick={() => fetchRewards()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">{error}</div> : null}
      {loading ? <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">Loading rewards...</div> : null}

      {!loading && rewards.length === 0 ? (
        <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">No rewards found for selected status.</div>
      ) : null}

      {!loading && rewards.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-900/60">
              <tr>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Group</th>
                <th className="px-3 py-2 text-left">Owner</th>
                <th className="px-3 py-2 text-left">Claimant</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Tx Hash</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward) => (
                <tr key={reward.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(reward.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 break-all">
                    <div className="font-semibold">{reward.groupOwner?.groupTitle || "(no title)"}</div>
                    <div className="text-xs text-slate-500">{reward.groupId}</div>
                  </td>
                  <td className="px-3 py-2 break-all">{reward.ownerWallet}</td>
                  <td className="px-3 py-2 break-all">{reward.claimantWallet}</td>
                  <td className="px-3 py-2">{Number(reward.rewardAmount || "0").toLocaleString()} EPWX</td>
                  <td className="px-3 py-2 capitalize">{reward.status}</td>
                  <td className="px-3 py-2 break-all text-xs">{reward.txHash || "-"}</td>
                  <td className="px-3 py-2">
                    {reward.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => markPaid(reward)}
                        disabled={markingId === reward.id}
                        className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
                      >
                        {markingId === reward.id ? "Saving..." : "Mark Paid"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
