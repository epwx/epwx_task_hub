"use client";

import { useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import MerchantClaimsTable from "@/components/MerchantClaimsTable";
import { parseJsonResponse } from "@/utils/apiErrors";

type TwitterClaim = {
  id: number | string;
  customer: string;
  bill?: string;
  status: string;
  claimType?: string;
  createdAt: string;
  receiptImage?: string;
  rejectionComment?: string;
  campaignCode?: string;
  twitterUsername?: string;
};

type TwitterTaskType = "retweet" | "comment" | "poll";
type ClaimsTaskTypeFilter = TwitterTaskType | "all";
type CampaignTaskTypeFilter = TwitterTaskType | "all";

type TwitterCampaign = {
  id: number;
  code: string;
  title: string;
  taskType: TwitterTaskType;
  tweetUrl: string;
  rewardAmount: string;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
};

type CampaignPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type CampaignStatusFilter = "all" | "active" | "inactive" | "expired";

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
  .split(",")
  .map(wallet => wallet.trim().toLowerCase())
  .filter(Boolean);

const TASK_TYPE_TO_CLAIM_TYPE: Record<TwitterTaskType, string> = {
  retweet: "twitter_retweet",
  comment: "twitter_comment",
  poll: "twitter_poll",
};

function getTaskLabel(taskType: TwitterTaskType) {
  switch (taskType) {
    case "comment":
      return "Comment";
    case "poll":
      return "Poll";
    default:
      return "Repost";
  }
}

function getTaskInstruction(taskType: TwitterTaskType) {
  switch (taskType) {
    case "comment":
      return "complete the comment task";
    case "poll":
      return "complete the poll task";
    default:
      return "complete the repost task";
  }
}

function getClaimsTaskLabel(taskType: ClaimsTaskTypeFilter) {
  return taskType === "all" ? "All" : getTaskLabel(taskType);
}

function getClaimsTaskInstruction(taskType: ClaimsTaskTypeFilter) {
  return taskType === "all" ? "complete engagement campaign tasks" : getTaskInstruction(taskType);
}

function isCampaignExpired(expiresAt?: string | null) {
  return !!expiresAt && new Date(expiresAt).getTime() < Date.now();
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

const themedSectionClass = "relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8";
const glassPanelClass = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl";
const selectClass = "rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white [&>option]:bg-white [&>option]:text-slate-900";
const formSelectClass = "rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white [&>option]:bg-white [&>option]:text-slate-900";
const editSelectClass = "rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [&>option]:bg-white [&>option]:text-slate-900";
const selectOptionClass = "bg-white text-slate-900";

export default function AdminEngagementClaimsPage() {
  const TWITTER_CLAIMS_PAGE_SIZE = 5;
  const TWITTER_CAMPAIGNS_PAGE_SIZE = 3;
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [claims, setClaims] = useState<TwitterClaim[]>([]);
  const [campaigns, setCampaigns] = useState<TwitterCampaign[]>([]);
  const [claimsPage, setClaimsPage] = useState(1);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignPagination, setCampaignPagination] = useState<CampaignPagination>({
    page: 1,
    limit: TWITTER_CAMPAIGNS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState("pending");
  const [claimsTaskTypeFilter, setClaimsTaskTypeFilter] = useState<ClaimsTaskTypeFilter>("retweet");
  const [campaignsTaskTypeFilter, setCampaignsTaskTypeFilter] = useState<CampaignTaskTypeFilter>("all");
  const [campaignsStatusFilter, setCampaignsStatusFilter] = useState<CampaignStatusFilter>("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<number | string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    code: "",
    title: "",
    taskType: "retweet" as TwitterTaskType,
    tweetUrl: "",
    rewardAmount: "100000",
    expiresAt: "",
  });
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [editCampaignForm, setEditCampaignForm] = useState({
    code: "",
    title: "",
    taskType: "retweet" as TwitterTaskType,
    tweetUrl: "",
    rewardAmount: "100000",
    expiresAt: "",
  });
  const [campaignUpdating, setCampaignUpdating] = useState(false);

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
  ];

  const isAdmin = !!address && ADMIN_WALLETS.includes(address.toLowerCase());

  const getCampaignClaimUrl = (campaignId: number) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/claim/engagement?campaignId=${campaignId}`;
    }
    return `/claim/engagement?campaignId=${campaignId}`;
  };

  const fetchClaims = async () => {
    if (!address || !isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("admin", address);
      params.set("status", statusFilter);

      if (claimsTaskTypeFilter !== "all") {
        params.set("claimType", TASK_TYPE_TO_CLAIM_TYPE[claimsTaskTypeFilter]);
      }

      const response = await fetch(`/api/claims?${params.toString()}`);
      const data = await parseJsonResponse<{ claims?: TwitterClaim[] }>(response, "Failed to fetch engagement claims");
      setClaims(data.claims || []);
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch engagement claims");
    }

    setLoading(false);
  };

  const fetchCampaigns = async (page = campaignsPage) => {
    if (!address || !isAdmin) {
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set('admin', address);
      params.set('page', String(page));
      params.set('limit', String(TWITTER_CAMPAIGNS_PAGE_SIZE));
      params.set('status', campaignsStatusFilter);
      if (campaignsTaskTypeFilter !== 'all') {
        params.set('taskType', campaignsTaskTypeFilter);
      }
      const response = await fetch(`/api/twitter-campaigns/list?${params.toString()}`);
      const data = await parseJsonResponse<{
        campaigns?: TwitterCampaign[];
        pagination?: CampaignPagination;
      }>(response, "Failed to fetch engagement campaigns");
      setCampaigns(data.campaigns || []);
      setCampaignPagination(data.pagination || {
        page,
        limit: TWITTER_CAMPAIGNS_PAGE_SIZE,
        total: data.campaigns?.length || 0,
        totalPages: 1,
      });

      if (data.pagination?.page && data.pagination.page !== campaignsPage) {
        setCampaignsPage(data.pagination.page);
      }
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch engagement campaigns");
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [address, statusFilter, claimsTaskTypeFilter]);

  useEffect(() => {
    fetchCampaigns(campaignsPage);
  }, [address, campaignsPage, campaignsTaskTypeFilter, campaignsStatusFilter]);

  useEffect(() => {
    setClaimsPage(1);
  }, [statusFilter, claimsTaskTypeFilter]);

  useEffect(() => {
    setCampaignsPage(1);
  }, [campaignsTaskTypeFilter, campaignsStatusFilter]);

  const totalClaimsPages = Math.max(1, Math.ceil(claims.length / TWITTER_CLAIMS_PAGE_SIZE));
  const paginatedClaims = claims.slice((claimsPage - 1) * TWITTER_CLAIMS_PAGE_SIZE, claimsPage * TWITTER_CLAIMS_PAGE_SIZE);
  const totalCampaignPages = campaignPagination.totalPages;

  useEffect(() => {
    if (claimsPage > totalClaimsPages) {
      setClaimsPage(totalClaimsPages);
    }
  }, [claimsPage, totalClaimsPages]);

  const handleCampaignFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCampaignForm(current => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleEditCampaignFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditCampaignForm(current => ({ ...current, [event.target.name]: event.target.value }));
  };

  const addCampaign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCampaignSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/twitter-campaigns/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...campaignForm, admin: address, expiresAt: toIsoDateTime(campaignForm.expiresAt) }),
      });
      const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response, "Failed to create campaign");

      if (!data.success) {
        setError(data.error || "Failed to create campaign");
      } else {
        setCampaignsTaskTypeFilter(campaignForm.taskType);
        setCampaignForm({ code: "", title: "", taskType: campaignForm.taskType, tweetUrl: "", rewardAmount: "100000", expiresAt: "" });
        setCampaignsPage(1);
      }
    } catch (saveError: any) {
      setError(saveError?.message || "Failed to create campaign");
    }

    setCampaignSaving(false);
  };

  const toggleCampaign = async (campaign: TwitterCampaign) => {
    setError(null);

    try {
      const response = await fetch(`/api/twitter-campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, isActive: !campaign.isActive }),
      });
      const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response, "Failed to update campaign");

      if (!data.success) {
        setError(data.error || "Failed to update campaign");
      } else {
        await fetchCampaigns(campaignsPage);
      }
    } catch (updateError: any) {
      setError(updateError?.message || "Failed to update campaign");
    }
  };

  const startEditingCampaign = (campaign: TwitterCampaign) => {
    setEditingCampaignId(campaign.id);
    setEditCampaignForm({
      code: campaign.code,
      title: campaign.title,
      taskType: campaign.taskType,
      tweetUrl: campaign.tweetUrl,
      rewardAmount: campaign.rewardAmount || "100000",
      expiresAt: toDateTimeLocalValue(campaign.expiresAt),
    });
  };

  const cancelEditingCampaign = () => {
    setEditingCampaignId(null);
    const defaultTaskType = campaignsTaskTypeFilter === "all" ? "retweet" : campaignsTaskTypeFilter;
    setEditCampaignForm({ code: "", title: "", taskType: defaultTaskType, tweetUrl: "", rewardAmount: "100000", expiresAt: "" });
  };

  const saveCampaignEdit = async (campaignId: number) => {
    setCampaignUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/twitter-campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editCampaignForm, admin: address, expiresAt: toIsoDateTime(editCampaignForm.expiresAt) }),
      });
      const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response, "Failed to save campaign changes");

      if (!data.success) {
        setError(data.error || "Failed to save campaign changes");
      } else {
        await fetchCampaigns(campaignsPage);
        cancelEditingCampaign();
      }
    } catch (updateError: any) {
      setError(updateError?.message || "Failed to save campaign changes");
    }

    setCampaignUpdating(false);
  };

  const rejectClaim = async (claim: TwitterClaim, rejectionComment: string) => {
    setMarking(claim.id);
    setError(null);

    try {
      const response = await fetch(`/api/claims/${claim.id}/mark-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, status: "rejected", rejectionComment }),
      });
      const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response, "Failed to reject claim");

      if (!data.success) {
        setError(data.error || "Failed to reject claim");
      } else {
        await fetchClaims();
      }
    } catch (rejectError: any) {
      setError(rejectError?.message || "Failed to reject claim");
    }

    setMarking(null);
  };

  const distributeClaim = async (claim: TwitterClaim) => {
    setMarking(claim.id);
    setError(null);

    try {
      const rewardAmount = claim.bill || "100000";
      const amount = ethers.parseUnits(String(rewardAmount), 9).toString();
      const txHash = await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [claim.customer as `0x${string}`, amount],
      });

      if (!publicClient) {
        setError("Public client not available");
        setMarking(null);
        return;
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setError("Token transfer failed or was reverted");
        setMarking(null);
        return;
      }

      const response = await fetch("/api/epwx/claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, claimId: claim.id, txHash, claimSource: "claim" }),
      });
      const data = await parseJsonResponse<{ success?: boolean; error?: string }>(response, "Failed to mark claim as paid");

      if (!data.success) {
        setError(data.error || "Failed to mark claim as paid");
      } else {
        await fetchClaims();
      }
    } catch (distributionError: any) {
      setError(distributionError?.message || "Failed to distribute EPWX");
    }

    setMarking(null);
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className={themedSectionClass}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 text-lg font-semibold text-white">Connect an admin wallet to review engagement proof submissions.</div>
            <ConnectKitButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={addCampaign} className={themedSectionClass}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
          <h2 className="text-2xl font-black text-white">Create Engagement Campaign</h2>
          <p className="mt-2 text-sm text-white/75">Create the trusted campaign record first, then share the generated claim URL.</p>
          <div className="mt-5 grid gap-4">
            <input name="code" value={campaignForm.code} onChange={handleCampaignFormChange} placeholder="campaign code" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50" required />
            <input name="title" value={campaignForm.title} onChange={handleCampaignFormChange} placeholder="campaign title" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50" required />
            <select name="taskType" value={campaignForm.taskType} onChange={handleCampaignFormChange} className={formSelectClass} required>
              <option value="retweet">Repost campaign</option>
              <option value="comment">Comment campaign</option>
              <option value="poll">Poll campaign</option>
            </select>
            <input name="tweetUrl" value={campaignForm.tweetUrl} onChange={handleCampaignFormChange} placeholder="https://x.com/..." className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50" required />
            <input name="rewardAmount" value={campaignForm.rewardAmount} onChange={handleCampaignFormChange} placeholder="100000" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50" required />
            <input name="expiresAt" type="datetime-local" value={campaignForm.expiresAt} onChange={handleCampaignFormChange} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white" />
            <div className="text-xs text-white/65">Leave expiry empty if this campaign should stay active until you disable it manually.</div>
            <button type="submit" disabled={campaignSaving} className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
              {campaignSaving ? "Creating..." : "Create Campaign"}
            </button>
          </div>
          </div>
        </form>

        <div className={themedSectionClass}>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
          <h2 className="text-2xl font-black text-white">Saved Campaigns</h2>
          <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/85">Campaign Task</label>
              <select
                value={campaignsTaskTypeFilter}
                onChange={(event) => setCampaignsTaskTypeFilter(event.target.value as CampaignTaskTypeFilter)}
                className={`w-full ${selectClass}`}
              >
                <option value="all">All</option>
                <option value="retweet">Retweet</option>
                <option value="comment">Comment</option>
                <option value="poll">Poll</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/85">Campaign Status</label>
              <select
                value={campaignsStatusFilter}
                onChange={(event) => setCampaignsStatusFilter(event.target.value as CampaignStatusFilter)}
                className={`w-full ${selectClass}`}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {campaigns.length === 0 ? <div className="text-sm text-white/75">No campaigns yet.</div> : null}
            {campaigns.map(campaign => (
              <div key={campaign.id} className={`${glassPanelClass} p-4`}>
                {(() => {
                  const expired = isCampaignExpired(campaign.expiresAt);
                  const statusLabel = !campaign.isActive ? 'Inactive' : expired ? 'Expired' : 'Active';
                  const statusClass = !campaign.isActive
                    ? 'bg-gray-200 text-gray-700'
                    : expired
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700';

                  return (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {editingCampaignId === campaign.id ? (
                      <div className="grid gap-3">
                        <input name="code" value={editCampaignForm.code} onChange={handleEditCampaignFormChange} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white" />
                        <input name="title" value={editCampaignForm.title} onChange={handleEditCampaignFormChange} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white" />
                        <select name="taskType" value={editCampaignForm.taskType} onChange={handleEditCampaignFormChange} className={editSelectClass}>
                          <option value="retweet">Repost campaign</option>
                          <option value="comment">Comment campaign</option>
                          <option value="poll">Poll campaign</option>
                        </select>
                        <input name="tweetUrl" value={editCampaignForm.tweetUrl} onChange={handleEditCampaignFormChange} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white" />
                        <input name="rewardAmount" value={editCampaignForm.rewardAmount} onChange={handleEditCampaignFormChange} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white" />
                        <input name="expiresAt" type="datetime-local" value={editCampaignForm.expiresAt} onChange={handleEditCampaignFormChange} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white" />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveCampaignEdit(campaign.id)} disabled={campaignUpdating} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                            {campaignUpdating ? 'Saving...' : 'Save'}
                          </button>
                          <button type="button" onClick={cancelEditingCampaign} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="break-words text-base font-bold text-white">{campaign.title}</div>
                        <div className="text-sm text-white/75">Code: {campaign.code}</div>
                        <div className="text-sm text-white/75">Task: {getTaskLabel(campaign.taskType)}</div>
                        <div className="text-sm text-white/75">Reward: {Number(campaign.rewardAmount || '100000').toLocaleString()} EPWX</div>
                        {campaign.expiresAt ? (
                          <div className="text-sm text-white/75">Expires: {new Date(campaign.expiresAt).toLocaleString()}</div>
                        ) : (
                          <div className="text-sm text-white/75">Expires: Never</div>
                        )}
                        <a href={campaign.tweetUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-emerald-200 underline hover:text-white">
                          View post
                        </a>
                        <div className="mt-2 break-all text-xs text-white/55">{getCampaignClaimUrl(campaign.id)}</div>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                    <button onClick={() => navigator.clipboard.writeText(getCampaignClaimUrl(campaign.id))} className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/10">
                      Copy Link
                    </button>
                    <button type="button" onClick={() => startEditingCampaign(campaign)} className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/10">
                      Edit
                    </button>
                    <button onClick={() => toggleCampaign(campaign)} className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/10">
                      {campaign.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
                  );
                })()}
              </div>
            ))}
            {campaigns.length > 0 ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85">
                <span>
                  Page {campaignPagination.page} of {totalCampaignPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                    disabled={campaignPagination.page === 1}
                    onClick={() => setCampaignsPage(page => Math.max(1, page - 1))}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                    disabled={campaignPagination.page >= totalCampaignPages}
                    onClick={() => setCampaignsPage(page => Math.min(totalCampaignPages, page + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </div>

      <div className={`${themedSectionClass} mb-6`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Engagement {getClaimsTaskLabel(claimsTaskTypeFilter)} Submissions</h1>
          <p className="mt-2 text-sm text-white/75">Review uploaded proof for users who {getClaimsTaskInstruction(claimsTaskTypeFilter)}, then approve eligible rewards or reject with a reason.</p>
          <p className="mt-1 text-xs text-white/65">This program is not sponsored by, endorsed by, or affiliated with X.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/85">Task</label>
          <select
            value={claimsTaskTypeFilter}
            onChange={(event) => setClaimsTaskTypeFilter(event.target.value as ClaimsTaskTypeFilter)}
            className={selectClass}
          >
            <option value="all" className={selectOptionClass}>All</option>
            <option value="retweet" className={selectOptionClass}>Repost</option>
            <option value="comment" className={selectOptionClass}>Comment</option>
            <option value="poll" className={selectOptionClass}>Poll</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/85">Status</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={selectClass}
          >
            <option value="pending" className={selectOptionClass}>Pending</option>
            <option value="paid" className={selectOptionClass}>Paid</option>
            <option value="rejected" className={selectOptionClass}>Rejected</option>
          </select>
        </div>
        </div>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-2xl border border-red-200/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {loading ? <div className={`${glassPanelClass} p-6 text-white/80`}>Loading claims...</div> : null}

      {!loading && claims.length === 0 ? (
        <div className={`${glassPanelClass} p-6 text-sm text-white/75`}>No engagement {getClaimsTaskLabel(claimsTaskTypeFilter).toLowerCase()} submissions match the current filter.</div>
      ) : null}

      {!loading && claims.length > 0 ? (
        <MerchantClaimsTable
          claims={paginatedClaims}
          isAdmin
          onDistribute={distributeClaim}
          onReject={rejectClaim}
          marking={marking}
          context="twitter"
        />
      ) : null}

      {!loading && claims.length > 0 ? (
        <div className="mt-4 text-center text-white/85">
          <button
            className="mr-2 rounded border border-white/20 bg-white/10 px-2 py-1 font-bold text-white hover:bg-white/20"
            disabled={claimsPage === 1}
            onClick={() => setClaimsPage(page => Math.max(1, page - 1))}
          >
            Prev
          </button>
          <span>Page {claimsPage} of {totalClaimsPages}</span>
          <button
            className="ml-2 rounded border border-white/20 bg-white/10 px-2 py-1 font-bold text-white hover:bg-white/20"
            disabled={claimsPage >= totalClaimsPages}
            onClick={() => setClaimsPage(page => Math.min(totalClaimsPages, page + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
