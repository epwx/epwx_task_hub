"use client";

import React from "react";
import { ethers } from "ethers";
import { ConnectKitButton } from "connectkit";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

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
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [rewards, setRewards] = React.useState<GroupReward[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [markingId, setMarkingId] = React.useState<string | null>(null);

  const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || "0x0000000000000000000000000000000000000000";
  const EPWX_TOKEN_ABI = [
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

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
      setError("Connect admin wallet to distribute rewards.");
      return;
    }

    if (!publicClient) {
      setError("Public client not available");
      return;
    }

    setMarkingId(reward.id);
    setError(null);

    try {
      const amount = ethers.parseUnits(String(reward.rewardAmount || "0"), 9);
      const txHash = await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [reward.ownerWallet as `0x${string}`, amount],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error("Token transfer failed or was reverted");
      }

      const res = await fetch(`/api/telegram-miniapp/group-owner/rewards/${encodeURIComponent(reward.id)}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, txHash }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string; reward?: GroupReward };
      if (!res.ok || !data.success || !data.reward) {
        throw new Error(data.error || "Failed to mark reward as paid");
      }

      setRewards((current) => current.map((item) => (item.id === reward.id ? data.reward! : item)));
    } catch (markError: any) {
      setError(markError?.message || "Failed to distribute reward");
    } finally {
      setMarkingId(null);
    }
  };

  const statusClass = (status: GroupReward["status"]) => {
    if (status === "paid") return "ui-status ui-status-success";
    if (status === "blocked") return "ui-status ui-status-danger";
    return "ui-status ui-status-warning";
  };

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-blue-600/12 blur-[130px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="ui-surface-strong p-6 text-center sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Telegram Rewards</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Group Owner Rewards</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Connect an admin wallet to view and distribute pending Telegram group-owner rewards.
            </p>
            <div className="mt-6 flex justify-center">
              <ConnectKitButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-blue-600/12 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl space-y-6">
        <section className="ui-surface-strong p-5 sm:p-6 lg:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Telegram Rewards</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Group Owner Rewards</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                Review eligible Telegram group-owner rewards, filter by payout status, and settle pending entries.
              </p>
            </div>
            <div className="ui-surface self-start px-4 py-3 text-sm text-slate-200">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Connected admin</div>
              <div className="mt-1 break-all font-semibold text-white">{address}</div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="ui-surface p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current filter</div>
              <div className="mt-2 text-2xl font-black text-white capitalize">{statusFilter}</div>
            </div>
            <div className="ui-surface p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Loaded rewards</div>
              <div className="mt-2 text-2xl font-black text-white">{rewards.length}</div>
            </div>
            <div className="ui-surface p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Settlement mode</div>
              <div className="mt-2 text-2xl font-black text-white">EPWX</div>
            </div>
          </div>
        </section>

        <section className="ui-surface-strong p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Distribution controls</p>
              <p className="mt-1 text-sm text-slate-300">Filter and refresh rewards before initiating payout transactions.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
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
                className="ui-btn-muted rounded-xl px-4 py-2 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {error ? <div className="mb-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div> : null}
          {loading ? <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">Loading rewards...</div> : null}

          {!loading && rewards.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">No rewards found for selected status.</div>
          ) : null}

          {!loading && rewards.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-sm text-slate-100">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-300">Created</th>
                    <th className="px-3 py-2 text-left text-slate-300">Group</th>
                    <th className="px-3 py-2 text-left text-slate-300">Owner</th>
                    <th className="px-3 py-2 text-left text-slate-300">Claimant</th>
                    <th className="px-3 py-2 text-left text-slate-300">Amount</th>
                    <th className="px-3 py-2 text-left text-slate-300">Status</th>
                    <th className="px-3 py-2 text-left text-slate-300">Tx Hash</th>
                    <th className="px-3 py-2 text-left text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((reward) => (
                    <tr key={reward.id} className="border-t border-white/10">
                      <td className="px-3 py-2 whitespace-nowrap">{new Date(reward.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2 break-all">
                        <div className="font-semibold text-white">{reward.groupOwner?.groupTitle || "(no title)"}</div>
                        <div className="text-xs text-slate-400">{reward.groupId}</div>
                      </td>
                      <td className="px-3 py-2 break-all text-slate-200">{reward.ownerWallet}</td>
                      <td className="px-3 py-2 break-all text-slate-200">{reward.claimantWallet}</td>
                      <td className="px-3 py-2">{Number(reward.rewardAmount || "0").toLocaleString()} EPWX</td>
                      <td className="px-3 py-2"><span className={statusClass(reward.status)}>{reward.status}</span></td>
                      <td className="px-3 py-2 break-all text-xs text-slate-300">{reward.txHash || "-"}</td>
                      <td className="px-3 py-2">
                        {reward.status === "pending" ? (
                          <button
                            type="button"
                            onClick={() => markPaid(reward)}
                            disabled={markingId === reward.id}
                            className="ui-btn-primary rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            {markingId === reward.id ? "Distributing..." : "Distribute"}
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
        </section>
      </main>
    </div>
  );
}
