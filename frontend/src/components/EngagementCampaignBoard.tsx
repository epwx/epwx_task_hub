"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseJsonResponse } from "@/utils/apiErrors";

type EngagementTaskType = "retweet" | "comment" | "poll";

type EngagementCampaign = {
  id: number;
  code: string;
  title: string;
  taskType: EngagementTaskType;
  tweetUrl: string;
  rewardAmount?: string | null;
  expiresAt?: string | null;
  claimStatus?: "pending" | "paid" | null;
};

type CampaignPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 6;

function getTaskLabel(taskType: EngagementTaskType) {
  switch (taskType) {
    case "comment":
      return "Comment";
    case "poll":
      return "Poll";
    default:
      return "Repost";
  }
}

function getTaskAction(taskType: EngagementTaskType) {
  switch (taskType) {
    case "comment":
      return "Comment & Upload Screenshot";
    case "poll":
      return "Vote & Upload Screenshot";
    default:
      return "Repost & Upload Screenshot";
  }
}

function formatExpiry(expiresAt?: string | null) {
  if (!expiresAt) return "No expiry set";

  const parsed = new Date(expiresAt);
  return Number.isNaN(parsed.getTime()) ? "Expiry unavailable" : parsed.toLocaleString();
}

export default function EngagementCampaignBoard({ wallet }: { wallet?: string }) {
  const [campaigns, setCampaigns] = useState<EngagementCampaign[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<CampaignPagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (wallet) params.set("wallet", wallet);

        const response = await fetch(`/api/twitter-campaigns/active?${params.toString()}`, { cache: "no-store" });
        const data = await parseJsonResponse<{
          campaigns?: EngagementCampaign[];
          pagination?: CampaignPagination;
        }>(response, "Failed to load engagement campaigns.");

        if (!cancelled) {
          const nextCampaigns = Array.isArray(data.campaigns) ? data.campaigns : [];
          setCampaigns(nextCampaigns);
          setPagination(data.pagination || {
            page,
            limit: PAGE_SIZE,
            total: nextCampaigns.length,
            totalPages: 1,
          });
        }
      } catch (fetchError) {
        if (!cancelled) {
          setCampaigns([]);
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load engagement campaigns.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchCampaigns();
    return () => {
      cancelled = true;
    };
  }, [page, wallet]);

  return (
    <section id="engagement-campaigns" className="py-12 scroll-mt-36">
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8">
        <div className="relative z-10">
          <div className="mb-6 text-center text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Community Engagement Rewards</p>
            <h2 className="mt-2 text-3xl font-black">Active Social Campaigns</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm text-white/75">
              Open a campaign, complete the requested social task, and upload a clear screenshot for manual review.
            </p>
          </div>

          {loading ? <div className="py-8 text-center text-white/75">Loading engagement campaigns...</div> : null}
          {!loading && error ? <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-center text-red-100">{error}</div> : null}
          {!loading && !error && campaigns.length === 0 ? <div className="py-8 text-center text-white/75">No active engagement campaigns are available right now.</div> : null}

          {!loading && !error && campaigns.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {campaigns.map((campaign) => (
                  <article key={campaign.id} className="flex min-h-64 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{campaign.code}</div>
                        <h3 className="mt-2 break-words text-xl font-black">{campaign.title}</h3>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${campaign.claimStatus === "pending" ? "border-amber-300/30 bg-amber-400/15 text-amber-100" : "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"}`}>
                        {campaign.claimStatus === "pending" ? "Pending" : "Active"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-white/70">
                      <div>Task: {getTaskLabel(campaign.taskType)}</div>
                      <div>Reward: {Number(campaign.rewardAmount || "100000").toLocaleString()} EPWX</div>
                      <div>Expires: {formatExpiry(campaign.expiresAt)}</div>
                    </div>

                    <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
                      <a href={campaign.tweetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-center text-sm font-bold hover:bg-white/10">
                        View Post
                      </a>
                      <Link href={`/claim/engagement?campaignId=${campaign.id}`} className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-slate-950 hover:bg-emerald-400">
                        {campaign.claimStatus === "pending" ? "View Pending Claim" : getTaskAction(campaign.taskType)}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {pagination.totalPages > 1 ? (
                <div className="mt-6 flex items-center justify-between gap-3 text-sm text-white/75">
                  <span>Page {pagination.page} of {pagination.totalPages}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={pagination.page <= 1 || loading} className="rounded-xl border border-white/15 px-4 py-2 font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                    <button type="button" onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} disabled={pagination.page >= pagination.totalPages || loading} className="rounded-xl border border-white/15 px-4 py-2 font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}