"use client";
import Link from "next/link";
import { EPWXCashbackClaim } from "@/components/EPWXCashbackClaim_clean";
import { HomeSwapCard } from "@/components/HomeSwapCard";
import { Fragment, useState, useEffect } from "react";
import DailyClaimsTable from "@/components/DailyClaimsTable";
import { useAccount, useBalance, useSignMessage } from "wagmi";
import { base } from "wagmi/chains";
import toast from "react-hot-toast";
import { ConnectKitButton } from "connectkit";

// Helper component to fetch and display user's daily claims
function UserDailyClaims({ address }: { address: string }) {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/epwx/daily-claims?wallet=${address}&status=pending`)
      .then(res => res.json())
      .then(data => setClaims(Array.isArray(data.claims) ? data.claims : []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, [address]);
  if (loading) return <div className="text-center text-gray-500">Loading daily claims...</div>;
  if (!claims.length) return <div className="text-center text-gray-600">No daily claims found.</div>;
  return <DailyClaimsTable claims={claims} isAdmin={false} />;
}

// Helper component to fetch and display user's last 5 paid daily claims (all wallets)
function LastFivePaidDailyClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/epwx/daily-claims?status=paid&limit=5`)
      .then(res => res.json())
      .then(data => setClaims(Array.isArray(data.claims) ? data.claims : []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-center text-gray-500">Loading daily claims...</div>;
  if (!claims.length) return <div className="text-center text-gray-600">No paid daily claims found.</div>;
  return <DailyClaimsTable claims={claims} isAdmin={false} />;
}

const themedSectionClass = "relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8";
const themedInnerClass = "relative z-10 flex flex-col items-center";
const glassPanelClass = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl";
const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || "0xef5f5751cf3eca6cc3572768298b7783d33d60eb";
const DEFAULT_DAILY_REWARD = 1_000_000;
const MID_TIER_DAILY_REWARD = 2_000_000;
const BONUS_DAILY_REWARD = 5_000_000;
const MID_TIER_DAILY_REWARD_THRESHOLD = 10_000_000_000;
const BONUS_DAILY_REWARD_THRESHOLD = 100_000_000_000;
const TELEGRAM_VERIFICATION_RECHECK_INTERVAL_MS = 60_000;
const DAILY_REWARD_TIERS = [
  {
    walletBalanceLabel: `At least ${BONUS_DAILY_REWARD_THRESHOLD.toLocaleString()} EPWX`,
    rewardLabel: `${BONUS_DAILY_REWARD.toLocaleString()} EPWX`,
  },
  {
    walletBalanceLabel: `At least ${MID_TIER_DAILY_REWARD_THRESHOLD.toLocaleString()} EPWX`,
    rewardLabel: `${MID_TIER_DAILY_REWARD.toLocaleString()} EPWX`,
  },
  {
    walletBalanceLabel: "Below 10,000,000,000 EPWX",
    rewardLabel: `${DEFAULT_DAILY_REWARD.toLocaleString()} EPWX`,
  },
];

interface DailyClaimsSummary {
  todayUtc: string;
  totalClaimsToday: number;
  totalPaidToday: number;
}

interface TwitterCampaign {
  id: number;
  code: string;
  title: string;
  tweetUrl: string;
  rewardAmount?: string | null;
  expiresAt?: string | null;
}

function formatDuration(msLeft: number) {
  if (msLeft <= 0) return "0m 0s";

  const totalSeconds = Math.floor(msLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatEpwxBalance(normalized: number) {
  if (!Number.isFinite(normalized) || normalized === 0) {
    return "0";
  }

  if (normalized >= 1) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  if (normalized >= 0.0001) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  if (normalized >= 0.00000001) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 8 });
  }

  return "<0.00000001";
}

function formatCampaignExpiry(expiresAt?: string | null) {
  if (!expiresAt) {
    return "No expiry set";
  }

  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Expiry unavailable";
  }

  return parsed.toLocaleString();
}

function TwitterCampaignBoard() {
  const [campaigns, setCampaigns] = useState<TwitterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/twitter-campaigns/active', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load Twitter campaigns.');
        }

        setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
      } catch (fetchError: any) {
        setCampaigns([]);
        setError(fetchError?.message || 'Failed to load Twitter campaigns.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <section className="py-12">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-black mb-4 text-blue-700 text-center">Twitter Campaigns</h2>
        <div className={`${themedSectionClass} w-full max-w-5xl`}>
          <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-6 text-center text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-white/65">Social rewards</p>
              <h3 className="mt-2 text-3xl font-black">View post, retweet, then upload your screenshot</h3>
              <p className="mt-3 text-sm text-white/80">Open any active campaign below. Each campaign card gives you a direct post link and a campaign URL where you can submit the screenshot after retweeting.</p>
            </div>

            {loading ? <div className="text-center text-white/80">Loading Twitter campaigns...</div> : null}
            {!loading && error ? <div className="text-center text-red-200">{error}</div> : null}
            {!loading && !error && campaigns.length === 0 ? <div className="text-center text-white/80">No active Twitter campaigns are available right now.</div> : null}

            {!loading && !error && campaigns.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white backdrop-blur-xl shadow-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-white/60">{campaign.code}</div>
                        <h4 className="mt-2 text-2xl font-black">{campaign.title}</h4>
                      </div>
                      <div className="rounded-full border border-emerald-300/30 bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-100">Active</div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-white/75">
                      <div>Reward: {Number(campaign.rewardAmount || '1000000').toLocaleString()} EPWX</div>
                      <div>Expires: {formatCampaignExpiry(campaign.expiresAt)}</div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <a
                        href={campaign.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/25"
                      >
                        View Post
                      </a>
                      <Link
                        href={`/claim/twitter-retweet?campaignId=${campaign.id}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700"
                      >
                        Retweet & Upload Screenshot
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomeTest() {
  const { address, isConnected } = useAccount();
  const { data: epwxBalance, isLoading: balanceLoading } = useBalance({
    address,
    token: EPWX_TOKEN_ADDRESS,
    chainId: base.id,
  });
  const normalizedEpwxBalance = Number(epwxBalance?.formatted || 0);
  const currentDailyReward = normalizedEpwxBalance >= BONUS_DAILY_REWARD_THRESHOLD
    ? BONUS_DAILY_REWARD
    : normalizedEpwxBalance >= MID_TIER_DAILY_REWARD_THRESHOLD
      ? MID_TIER_DAILY_REWARD
      : DEFAULT_DAILY_REWARD;

  const [specialEligible, setSpecialEligible] = useState(false);
  const [specialClaiming, setSpecialClaiming] = useState(false);
  const [specialClaimStatus, setSpecialClaimStatus] = useState<string | null>(null);
  useEffect(() => {
    const checkSpecialClaim = async () => {
      if (!address) {
        setSpecialEligible(false);
        return;
      }
      try {
        const res = await fetch(`/api/epwx/special-claim/status?wallet=${address}`);
        const data = await res.json();
        setSpecialEligible(!!data.eligible);
      } catch (e) {
        setSpecialEligible(false);
      }
    };
    checkSpecialClaim();
  }, [address]);

  const handleSpecialClaim = async () => {
    setSpecialClaiming(true);
    setSpecialClaimStatus(null);
    try {
      const res = await fetch("/api/epwx/special-claim/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });
      const data = await res.json();
      if (data.success) {
        setSpecialClaimStatus("Special claim submitted. Pending admin approval.");
        setSpecialEligible(false);
        toast.success("Special claim submitted! Pending admin approval.");
      } else {
        setSpecialClaimStatus(data.error || "Special claim failed");
        toast.error(data.error || "Special claim failed");
      }
    } catch (e) {
      setSpecialClaimStatus("Special claim failed");
      toast.error("Special claim failed");
    }
    setSpecialClaiming(false);
  };

  const [copied, setCopied] = useState(false);

  const { signMessageAsync } = useSignMessage();
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [nextDailyClaimAt, setNextDailyClaimAt] = useState<number | null>(null);
  const [remainingClaimTime, setRemainingClaimTime] = useState<string | null>(null);
  const [hasDailyClaimHistory, setHasDailyClaimHistory] = useState(false);
  const [dailyClaimsSummary, setDailyClaimsSummary] = useState<DailyClaimsSummary | null>(null);
  const [dailyClaimsSummaryLoading, setDailyClaimsSummaryLoading] = useState(true);
  const [isTelegramVerified, setIsTelegramVerified] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [cmcChecked, setCmcChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [specialAgreed, setSpecialAgreed] = useState(false);
  const [showSpecialTerms, setShowSpecialTerms] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  const fetchDailyClaimsSummary = async () => {
    setDailyClaimsSummaryLoading(true);
    try {
      const res = await fetch('/api/epwx/daily-claims/summary', { cache: 'no-store' });
      const data = await res.json();

      if (res.ok) {
        setDailyClaimsSummary({
          todayUtc: data.todayUtc,
          totalClaimsToday: Number(data.totalClaimsToday || 0),
          totalPaidToday: Number(data.totalPaidToday || 0),
        });
      } else {
        setDailyClaimsSummary(null);
      }
    } catch {
      setDailyClaimsSummary(null);
    } finally {
      setDailyClaimsSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyClaimsSummary();
  }, []);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const checkVerification = async () => {
      if (!address) {
        setIsTelegramVerified(false);
        return;
      }

      setCheckingVerification(true);
      try {
        const res = await fetch(`${API_URL}/api/epwx/telegram-verified?wallet=${address}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Verification check failed');
        }
        const data = await res.json();
        setIsTelegramVerified(!!data.verified);
      } catch {
        setIsTelegramVerified((currentValue) => currentValue);
      }
      setCheckingVerification(false);
    };

    checkVerification();

    if (!address) {
      return;
    }

    const handleFocus = () => {
      checkVerification();
    };

    window.addEventListener('focus', handleFocus);

    const intervalId = isTelegramVerified
      ? null
      : window.setInterval(checkVerification, TELEGRAM_VERIFICATION_RECHECK_INTERVAL_MS);

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [address, isTelegramVerified]);

  useEffect(() => {
    const fetchLatestDailyClaim = async () => {
      if (!address) {
        setHasDailyClaimHistory(false);
        setNextDailyClaimAt(null);
        return;
      }

      try {
        const res = await fetch(`/api/epwx/daily-claims?wallet=${address}&limit=1`);
        const data = await res.json();
        const latestClaim = Array.isArray(data.claims) ? data.claims[0] : null;

        if (!latestClaim?.claimedAt) {
          setHasDailyClaimHistory(false);
          setNextDailyClaimAt(null);
          return;
        }

        setHasDailyClaimHistory(true);
        const nextClaimTime = new Date(latestClaim.claimedAt).getTime() + 24 * 60 * 60 * 1000;
        setNextDailyClaimAt(nextClaimTime);
      } catch {
        setHasDailyClaimHistory(false);
        setNextDailyClaimAt(null);
      }
    };

    fetchLatestDailyClaim();
  }, [address, claimStatus]);

  useEffect(() => {
    if (!nextDailyClaimAt) {
      setRemainingClaimTime(null);
      return;
    }

    const updateRemainingTime = () => {
      const msLeft = nextDailyClaimAt - Date.now();

      if (msLeft <= 0) {
        setRemainingClaimTime(null);
        setNextDailyClaimAt(null);
        return;
      }

      setRemainingClaimTime(formatDuration(msLeft));
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(intervalId);
  }, [nextDailyClaimAt]);

  const handleDailyClaim = async () => {
    setClaiming(true);
    setClaimStatus(null);
    try {
      const todayUtc = new Date(Date.now()).toISOString().slice(0, 10);
      const message = `EPWX Daily Claim for ${address} on ${todayUtc}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/epwx/daily-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, signature }),
      });
      const data = await res.json();
      if (data.success) {
        const claimedAmount = Number(data.amount || DEFAULT_DAILY_REWARD).toLocaleString();
        setClaimStatus(`Successfully claimed ${claimedAmount} EPWX! Your reward will be sent soon.`);
        fetchDailyClaimsSummary();
      } else {
        setClaimStatus(data.error || "Claim failed");
      }
    } catch (e) {
      setClaimStatus("Claim failed");
    }
    setClaiming(false);
  };

  let formattedBalance = "0";
  if (epwxBalance) {
    try {
      formattedBalance = formatEpwxBalance(Number(epwxBalance.formatted));
    } catch {
      formattedBalance = "0";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:bg-gray-950 dark:bg-none flex flex-col">
      <main className="container mx-auto px-4 py-12 flex-1">
        {/* Wallet Connection & Verification Section */}
        <section className="my-8">
          <div className={`${themedSectionClass} mb-6 w-full max-w-lg mx-auto`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className={themedInnerClass}>
            <h2 className="text-2xl font-black mb-4 text-center text-white w-full">Wallet & Telegram Verification</h2>
            {!address ? (
              <div className="flex flex-col items-center w-full">
                <span className="mb-2 text-white/80 text-center">Please connect your wallet to access all features.</span>
                <ConnectKitButton />
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className={`mb-3 w-full flex flex-col items-center p-4 ${glassPanelClass}`}>
                  <span className="text-white/80 font-medium text-center break-all w-full">
                    Connected wallet:
                    <span className="block text-xs text-white font-mono bg-white/10 rounded px-2 py-1 mt-1 w-full overflow-x-auto" style={{wordBreak: 'break-all'}}>{address}</span>
                  </span>
                </div>
                <div className={`mb-3 w-full p-4 ${glassPanelClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-white/80 font-medium">EPWX balance</span>
                    <span className="text-lg font-bold text-emerald-300">
                      {balanceLoading ? "Loading..." : `${formattedBalance} EPWX`}
                    </span>
                  </div>
                </div>
                {checkingVerification ? (
                  <span className="text-white/70">Checking Telegram verification...</span>
                ) : isTelegramVerified ? (
                  <span className="bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 font-bold py-3 px-4 rounded-xl mb-2 w-full text-center block">✅ Telegram membership verified</span>
                ) : isTelegramVerified === null ? (
                  <span className="bg-white/10 border border-white/20 text-white/80 font-medium py-3 px-4 rounded-xl mb-2 w-full text-center block">Unable to confirm Telegram verification right now. Refresh or try again in a moment.</span>
                ) : (
                  <a
                    href={`https://t.me/epwx_bot?start=${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/15 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-4 rounded-xl mb-2 w-full text-center transition-colors"
                  >Verify Telegram Membership</a>
                )}
              </div>
            )}
            </div>
          </div>
        </section>

        <section id="buy-epwx" className="py-8 scroll-mt-24">
          <HomeSwapCard />
        </section>

        <TwitterCampaignBoard />

        {/* Cashback Rewards Section */}
        <section className="py-12">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black mb-4 text-blue-700 text-center">Cashback Rewards</h2>
            <div className={`${themedSectionClass} w-full max-w-xl`}>
              <EPWXCashbackClaim />
            </div>
          </div>
        </section>

        {/* Special EPWX Claim Section */}
        {address && isTelegramVerified && specialEligible && (
          <section className="py-12">
            <div className={`${themedSectionClass} w-full max-w-lg mx-auto`}>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl"></div>
              <div className={themedInnerClass}>
              <h2 className="text-2xl font-black mb-4 text-white">Special Claim</h2>
              <p className="mb-4 text-white/85 text-center">You are eligible for a <b>Special 1,000,000 EPWX</b> reward!</p>
              <div className="flex items-center mb-4">
                <input
                  id="special-terms-checkbox"
                  type="checkbox"
                  checked={specialAgreed}
                  onChange={e => setSpecialAgreed(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="special-terms-checkbox" className="text-sm text-white/85">
                  I agree to the{' '}
                  <button
                    type="button"
                    className="text-emerald-200 underline hover:text-white"
                    onClick={() => setShowSpecialTerms(true)}
                  >
                    terms and conditions
                  </button>
                </label>
              </div>
              <button
                onClick={handleSpecialClaim}
                disabled={specialClaiming || !specialAgreed}
                className={`px-6 py-3 rounded-lg font-bold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors mb-4 ${specialClaiming || !specialAgreed ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {specialClaiming ? 'Claiming...' : 'Claim Special 1,000,000 EPWX'}
              </button>
              {showSpecialTerms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white/95 backdrop-blur-md text-gray-900 dark:bg-gray-900/95 dark:text-gray-100 rounded-2xl shadow-2xl border border-blue-100 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                      onClick={() => setShowSpecialTerms(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <div className="prose max-w-none text-gray-900 dark:text-gray-100">
                      <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
                      <p className="mb-4">Welcome to EPWX Task Hub. By accessing or using our platform, you agree to these Terms and Conditions. Please read them carefully.</p>
                      <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
                      <p className="mb-4">By using EPWX Task Hub, you agree to comply with these Terms and all applicable laws. If you do not agree, do not use the platform.</p>
                      <h2 className="text-lg font-semibold mt-6 mb-2">2. User Responsibilities</h2>
                      <ul className="list-disc pl-6 mb-4">
                        <li>Provide accurate, complete, and current information during registration and task submissions.</li>
                        <li>Do not engage in fraudulent, abusive, or illegal activities.</li>
                        <li>Respect other users, platform administrators, and all applicable laws.</li>
                        <li>Maintain the confidentiality of your account credentials and notify us immediately of any unauthorized use.</li>
                      </ul>
                      <h2 className="text-lg font-semibold mt-6 mb-2">3. Prohibited Conduct</h2>
                      <ul className="list-disc pl-6 mb-4">
                        <li>No use of bots, scripts, or automated methods to access or use the platform.</li>
                        <li>No uploading of viruses, malware, or harmful code.</li>
                        <li>No attempts to disrupt, damage, or gain unauthorized access to the platform or other users’ accounts.</li>
                      </ul>
                      <h2 className="text-lg font-semibold mt-6 mb-2">4. Platform Rights</h2>
                      <ul className="list-disc pl-6 mb-4">
                        <li>We may modify, suspend, or terminate the platform or your access at any time, for any reason, without notice.</li>
                        <li>We may change these Terms at any time. Continued use constitutes acceptance of the revised Terms.</li>
                        <li>We reserve all rights not expressly granted to you.</li>
                      </ul>
                      <h2 className="text-lg font-semibold mt-6 mb-2">5. Intellectual Property</h2>
                      <p className="mb-4">All content, trademarks, and data on EPWX Task Hub are the property of their respective owners. You may not copy, modify, or distribute any content without permission.</p>
                      <h2 className="text-lg font-semibold mt-6 mb-2">6. Limitation of Liability</h2>
                      <p className="mb-4">EPWX Task Hub is provided “as is” and “as available.” We disclaim all warranties, express or implied. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.</p>
                      <h2 className="text-lg font-semibold mt-6 mb-2">7. Indemnification</h2>
                      <p className="mb-4">You agree to indemnify and hold harmless EPWX Task Hub, its affiliates, and staff from any claims, damages, or expenses arising from your use of the platform or violation of these Terms.</p>
                      <h2 className="text-lg font-semibold mt-6 mb-2">8. Privacy</h2>
                      <p className="mb-4">We respect your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
                      <h2 className="text-lg font-semibold mt-6 mb-2">9. Governing Law</h2>
                      <p className="mb-4">These Terms are governed by the laws of the jurisdiction in which EPWX Task Hub operates.</p>
                      <h2 className="text-lg font-semibold mt-6 mb-2">10. Contact</h2>
                      <p>If you have questions about these Terms, please contact info@epowex.com.</p>
                      <div className="mt-8 flex justify-end not-prose">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                          onClick={() => setShowSpecialTerms(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {specialClaimStatus && (
                <div className="text-center text-lg font-semibold text-white mb-2">{specialClaimStatus}</div>
              )}
              </div>
            </div>
          </section>
        )}

        {/* Daily Claim Section */}
        <section className="py-12">
          <div className={`${themedSectionClass} w-full max-w-lg mx-auto`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className={themedInnerClass}>
            <h2 className="text-2xl font-black mb-4 text-white">Daily Claim</h2>
            <div className="grid w-full grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
              <div className={`${glassPanelClass} p-4 text-center`}>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">Claims Today</div>
                <div className="mt-2 text-3xl font-black text-white">
                  {dailyClaimsSummaryLoading ? '...' : (dailyClaimsSummary?.totalClaimsToday ?? 0).toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-white/75">Total submitted today</div>
              </div>
              <div className={`${glassPanelClass} p-4 text-center`}>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">Paid Today</div>
                <div className="mt-2 text-3xl font-black text-emerald-200">
                  {dailyClaimsSummaryLoading ? '...' : (dailyClaimsSummary?.totalPaidToday ?? 0).toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-white/75">Rewards marked paid today</div>
              </div>
            </div>
            {address ? (
              isTelegramVerified ? (
                <>
                  <div className={`${glassPanelClass} mb-5 w-full overflow-hidden text-sm text-white/90`}>
                    <div className="border-b border-white/15 bg-white/5 px-4 py-3 text-center sm:text-left">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Claim Rules</div>
                      <div className="mt-1 text-base font-semibold text-white">One daily reward claim every 24 hours</div>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-white/10">
                      <div className="bg-slate-950/20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                        Wallet Balance
                      </div>
                      <div className="bg-slate-950/20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                        Daily Reward
                      </div>
                      {DAILY_REWARD_TIERS.map((tier) => (
                        <Fragment key={tier.walletBalanceLabel}>
                          <div className="bg-white/5 px-4 py-3 leading-6 text-white/85">
                            {tier.walletBalanceLabel}
                          </div>
                          <div className="bg-white/5 px-4 py-3 font-semibold leading-6 text-emerald-100">
                            {tier.rewardLabel}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    {address && !balanceLoading && (
                      <div className="border-t border-white/15 bg-emerald-400/10 px-4 py-3 text-center font-semibold text-emerald-100 sm:text-left">
                        Your current daily reward tier: {currentDailyReward.toLocaleString()} EPWX
                      </div>
                    )}
                  </div>
                  <div className="flex items-center mb-4">
                    <input
                      id="daily-terms-checkbox"
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="daily-terms-checkbox" className="text-sm text-white/85">
                      I agree to the{' '}
                      <button
                        type="button"
                        className="text-emerald-200 underline hover:text-white"
                        onClick={() => setShowTerms(true)}
                      >
                        terms and conditions
                      </button>
                    </label>
                  </div>
                  <div className="flex items-center mb-4">
                    <input
                      id="cmc-watchlist-checkbox"
                      type="checkbox"
                      checked={cmcChecked}
                      onChange={e => setCmcChecked(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="cmc-watchlist-checkbox" className="text-sm text-white/85">
                      I have added EPWX to my
                      <a href="https://coinmarketcap.com/currencies/epowerx-on-base/" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline ml-1 hover:text-white">CoinMarketCap watchlist</a>
                    </label>
                  </div>
                  <button
                    onClick={handleDailyClaim}
                    disabled={claiming || !agreed || !cmcChecked || !!remainingClaimTime}
                    className={`px-6 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 transition-colors mb-4 ${claiming || !agreed || !cmcChecked || !!remainingClaimTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {claiming ? 'Claiming...' : 'Claim Daily Reward'}
                  </button>
                  {remainingClaimTime && (
                    <div className="text-center text-sm font-semibold text-yellow-100 mb-4">
                      Next daily claim available in {remainingClaimTime}
                    </div>
                  )}
                  {!remainingClaimTime && hasDailyClaimHistory && (
                    <div className="text-center text-sm font-semibold text-emerald-100 mb-4">
                      Daily claim is available now.
                    </div>
                  )}
                  {!remainingClaimTime && !hasDailyClaimHistory && (
                    <div className="text-center text-sm font-semibold text-white/80 mb-4">
                      No previous daily claim found. You can claim now.
                    </div>
                  )}
                  {showTerms && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white/95 backdrop-blur-md text-gray-900 dark:bg-gray-900/95 dark:text-gray-100 rounded-2xl shadow-2xl border border-blue-100 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                        <button
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                          onClick={() => setShowTerms(false)}
                          aria-label="Close"
                        >
                          &times;
                        </button>
                        <div className="prose max-w-none text-gray-900 dark:text-gray-100">
                          <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
                          <p className="mb-4">Welcome to EPWX Task Hub. By accessing or using our platform, you agree to these Terms and Conditions. Please read them carefully.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
                          <p className="mb-4">By using EPWX Task Hub, you agree to comply with these Terms and all applicable laws. If you do not agree, do not use the platform.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">2. User Responsibilities</h2>
                          <ul className="list-disc pl-6 mb-4">
                            <li>Provide accurate, complete, and current information during registration and task submissions.</li>
                            <li>Do not engage in fraudulent, abusive, or illegal activities.</li>
                            <li>Respect other users, platform administrators, and all applicable laws.</li>
                            <li>Maintain the confidentiality of your account credentials and notify us immediately of any unauthorized use.</li>
                          </ul>
                          <h2 className="text-lg font-semibold mt-6 mb-2">3. Prohibited Conduct</h2>
                          <ul className="list-disc pl-6 mb-4">
                            <li>No use of bots, scripts, or automated methods to access or use the platform.</li>
                            <li>No uploading of viruses, malware, or harmful code.</li>
                            <li>No attempts to disrupt, damage, or gain unauthorized access to the platform or other users’ accounts.</li>
                          </ul>
                          <h2 className="text-lg font-semibold mt-6 mb-2">4. Platform Rights</h2>
                          <ul className="list-disc pl-6 mb-4">
                            <li>We may modify, suspend, or terminate the platform or your access at any time, for any reason, without notice.</li>
                            <li>We may change these Terms at any time. Continued use constitutes acceptance of the revised Terms.</li>
                            <li>We reserve all rights not expressly granted to you.</li>
                          </ul>
                          <h2 className="text-lg font-semibold mt-6 mb-2">5. Intellectual Property</h2>
                          <p className="mb-4">All content, trademarks, and data on EPWX Task Hub are the property of their respective owners. You may not copy, modify, or distribute any content without permission.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">6. Limitation of Liability</h2>
                          <p className="mb-4">EPWX Task Hub is provided “as is” and “as available.” We disclaim all warranties, express or implied. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">7. Indemnification</h2>
                          <p className="mb-4">You agree to indemnify and hold harmless EPWX Task Hub, its affiliates, and staff from any claims, damages, or expenses arising from your use of the platform or violation of these Terms.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">8. Privacy</h2>
                          <p className="mb-4">We respect your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">9. Governing Law</h2>
                          <p className="mb-4">These Terms are governed by the laws of the jurisdiction in which EPWX Task Hub operates.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">10. Contact</h2>
                          <p>If you have questions about these Terms, please contact info@epowex.com.</p>
                          <div className="mt-8 flex justify-end not-prose">
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                              onClick={() => setShowTerms(false)}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {claimStatus && (
                    <div className="text-center text-lg font-semibold text-white mb-2">{claimStatus}</div>
                  )}
                </>
              ) : (
                <div className="text-center text-red-200 font-semibold mb-2">Please verify your Telegram membership to claim daily rewards.</div>
              )
            ) : (
              <div className="text-center text-white/80 font-semibold mb-2">Connect your wallet to claim daily rewards.</div>
            )}
            </div>
          </div>
        </section>

        {/* User Daily Claims Table Section */}
        {address && (
          <section className="py-12">
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-black mb-4 text-blue-700 text-center">Your Daily Pending Claims</h2>
              <div className={`${themedSectionClass} w-full max-w-xl`}>
                <UserDailyClaims address={address} />
              </div>
            </div>
          </section>
        )}

        {/* Last 5 Paid Daily Claims Section */}
        <section className="py-12">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black mb-4 text-blue-700 text-center">Last 5 Paid Daily Claims (All Wallets)</h2>
            <div className={`${themedSectionClass} w-full max-w-xl`}>
              <LastFivePaidDailyClaims />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-xl border-t border-blue-100 text-gray-800 py-12 mt-20 dark:bg-gray-950/80 dark:text-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-300">EPWX Task Platform</h3>
            <p className="text-gray-500 dark:text-gray-400">Earn tokens by completing campaigns on Base Network</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-6">
            <a href="https://epowex.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Main Site</a>
            <span className="hidden md:block text-blue-200 dark:text-gray-700">•</span>
            <a href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <span className="hidden md:block text-blue-200 dark:text-gray-700">•</span>
            <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <span className="hidden md:block text-blue-200 dark:text-gray-700">•</span>
            <a href="/user-guide" className="hover:text-blue-600 transition-colors">User Guide</a>
            <span className="hidden md:block text-blue-200 dark:text-gray-700">•</span>
            <a href="https://twitter.com/epowex" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Twitter</a>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>&copy; 2025 EPWX Task Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
