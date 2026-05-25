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
  tweetUrl: string;
  rewardAmount: string;
  expiresAt?: string | null;
};

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
      setError("Invalid Twitter campaign link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/twitter-campaigns/${campaignId}`)
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
  }, [campaignIdParam]);

  if (loading) {
    return <div className="px-4 py-10 text-center text-white/80">Loading campaign...</div>;
  }

  if (error || !campaign) {
    return <div className="px-4 py-10 text-center text-red-300">{error || "Campaign not found."}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-xl">
          <div className="mb-6 text-center text-white">
            <div className="text-xs uppercase tracking-[0.35em] text-white/70">EPWX social rewards</div>
            <h1 className="mt-3 text-4xl font-black">{campaign.title}</h1>
            <p className="mt-3 text-sm text-white/80">
              Upload a screenshot that clearly shows your retweet. The admin team will review the image before approving the reward.
            </p>
            {campaign.tweetUrl ? (
              <a
                href={campaign.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                View the original post
              </a>
            ) : null}
          </div>

          {!address ? (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-center text-white backdrop-blur-xl">
              <div className="mb-4 text-white/80">Connect your wallet first so approved rewards can be sent to the correct address.</div>
              <ConnectKitButton />
            </div>
          ) : (
            <TwitterRetweetClaimForm
              wallet={address}
              twitterCampaignId={campaign.id}
              campaignCode={campaign.code}
              title={campaign.title}
              rewardAmount={campaign.rewardAmount}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TwitterRetweetClaimPageWrapper() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-center">Loading...</div>}>
      <TwitterRetweetClaimPage />
    </Suspense>
  );
}