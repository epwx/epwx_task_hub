"use client";

import { Suspense, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useSearchParams } from "next/navigation";
import TwitterRetweetClaimForm from "@/components/TwitterRetweetClaimForm";

type TwitterCampaign = {
  id: number;
  code: string;
  title: string;
  taskType: 'retweet' | 'comment' | 'poll' | 'rating';
  tweetUrl: string;
  rewardAmount: string;
  expiresAt?: string | null;
  claimStatus?: 'pending' | 'paid' | null;
};

function getTaskIntentUrl(tweetUrl: string, taskType: 'retweet' | 'comment' | 'poll' | 'rating') {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(tweetUrl);
  } catch {
    return tweetUrl;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isXPost = hostname === 'x.com'
    || hostname.endsWith('.x.com')
    || hostname === 'twitter.com'
    || hostname.endsWith('.twitter.com');
  const match = isXPost ? parsedUrl.pathname.match(/status\/(\d+)/i) : null;

  if (match?.[1]) {
    if (taskType === 'comment') {
      return `https://twitter.com/intent/tweet?in_reply_to=${match[1]}`;
    }

    if (taskType === 'poll' || taskType === 'rating') {
      return tweetUrl;
    }

    return `https://twitter.com/intent/retweet?tweet_id=${match[1]}`;
  }

  return tweetUrl;
}

function getTaskVerb(taskType: 'retweet' | 'comment' | 'poll' | 'rating') {
  switch (taskType) {
    case 'comment':
      return 'complete the comment task';
    case 'poll':
      return 'complete the poll task';
    case 'rating':
      return 'complete the rating task';
    default:
      return 'complete the repost task';
  }
}

function getTaskCta(taskType: 'retweet' | 'comment' | 'poll' | 'rating') {
  switch (taskType) {
    case 'comment':
      return 'Open Comment Task';
    case 'poll':
      return 'Open Poll Task';
    case 'rating':
      return 'Open Rating Task';
    default:
      return 'Open Repost Task';
  }
}

function TwitterRetweetClaimPage() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("campaignId") || searchParams.get("campaign");
  const [campaign, setCampaign] = useState<TwitterCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const campaignId = Number(campaignIdParam);

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      setCampaign(null);
      setError("Invalid social campaign link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (address) {
      params.set("wallet", address);
    }

    fetch(`/api/twitter-campaigns/${campaignId}${params.toString() ? `?${params.toString()}` : ''}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Campaign not found");
        }
        return data;
      })
      .then(data => {
        setCampaign(data);
        setLoading(false);
      })
      .catch(fetchError => {
        setCampaign(null);
        setError(fetchError?.message || "Failed to load campaign.");
        setLoading(false);
      });
  }, [address, campaignIdParam]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-950 px-4 py-10">
        <div className="ui-surface-strong mx-auto max-w-2xl px-6 py-8 text-center text-slate-300">Loading campaign...</div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-950 px-4 py-10">
        <div className="ui-surface-strong mx-auto max-w-2xl border-rose-300/20 px-6 py-8 text-center text-rose-200">{error || "Campaign not found."}</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-950 px-4 py-8 text-white sm:py-12">
      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <section className="ui-surface-strong relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Social Engagement Reward</p>
              <h1 className="mt-3 break-words text-3xl font-black text-white sm:text-4xl">{campaign.title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                View the campaign post, {getTaskVerb(campaign.taskType)}, and submit clear proof for manual review.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-cyan-100">
                {campaign.taskType === 'retweet' ? 'Repost' : campaign.taskType}
              </span>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                {Number(campaign.rewardAmount || '100000').toLocaleString()} EPWX
              </span>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <div className="ui-surface p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Step 1</div>
              <div className="mt-2 font-bold text-white">View the campaign post</div>
              <p className="mt-1 text-sm text-slate-400">Review the original content and task details.</p>
            </div>
            <div className="ui-surface p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Step 2</div>
              <div className="mt-2 font-bold text-white">Complete the social action</div>
              <p className="mt-1 text-sm text-slate-400">Use your own account and follow platform rules.</p>
            </div>
            <div className="ui-surface p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Step 3</div>
              <div className="mt-2 font-bold text-white">Upload clear proof</div>
              <p className="mt-1 text-sm text-slate-400">Submit a screenshot for admin review.</p>
            </div>
          </div>

          {campaign.tweetUrl ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href={campaign.tweetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                View Post
              </a>
              <a href={getTaskIntentUrl(campaign.tweetUrl, campaign.taskType)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-emerald-400">
                {getTaskCta(campaign.taskType)}
              </a>
            </div>
          ) : null}

          <p className="mt-5 text-xs leading-5 text-slate-500">Participation must comply with the selected platform&apos;s rules and applicable laws. Campaigns are independently operated by EPWX.</p>
        </section>

        {!address ? (
          <section className="ui-surface-strong p-5 sm:p-6">
            <div className="ui-surface mx-auto max-w-2xl p-5 text-center sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Wallet Required</p>
              <h2 className="mt-2 text-2xl font-black text-white">Connect to submit proof</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">The connected wallet identifies where an approved reward should be sent. Connecting does not move funds or grant token spending permission.</p>
              <div className="mt-5 flex justify-center"><ConnectKitButton /></div>
            </div>
          </section>
        ) : (
          <TwitterRetweetClaimForm
            wallet={address}
            twitterCampaignId={campaign.id}
            campaignCode={campaign.code}
            title={campaign.title}
            taskType={campaign.taskType}
            rewardAmount={campaign.rewardAmount}
            claimStatus={campaign.claimStatus}
          />
        )}
      </main>
    </div>
  );
}

export default function TwitterRetweetClaimPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-5rem)] bg-slate-950 px-4 py-10 text-center text-slate-300">Loading...</div>}>
      <TwitterRetweetClaimPage />
    </Suspense>
  );
}