"use client";

import { Suspense } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useSearchParams } from "next/navigation";
import TwitterRetweetClaimForm from "@/components/TwitterRetweetClaimForm";

function TwitterRetweetClaimPage() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const campaignCode = searchParams.get("campaign");
  const title = searchParams.get("title");
  const tweetUrl = searchParams.get("tweet");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.35),_transparent_35%),linear-gradient(135deg,_#0f172a,_#1d4ed8_45%,_#0f766e)] p-8 shadow-2xl">
        <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-xl">
          <div className="mb-6 text-center text-white">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-100/70">EPWX social rewards</div>
            <h1 className="mt-3 text-4xl font-black">Claim EPWX for your retweet</h1>
            <p className="mt-3 text-sm text-white/80">
              Upload a screenshot that clearly shows your retweet. The admin team will review the image before approving the reward.
            </p>
            {tweetUrl ? (
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
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
            <TwitterRetweetClaimForm wallet={address} campaignCode={campaignCode} title={title} />
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