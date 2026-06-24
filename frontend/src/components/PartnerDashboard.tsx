"use client";

import { useState, useEffect } from "react";
import PartnerEarningsTable from "./PartnerEarningsTable";
import toast from "react-hot-toast";

interface Partner {
  id: string;
  name: string;
  walletAddress: string;
  status: string;
  totalEarnings: string;
  totalReferredUsers: number;
  createdAt: string;
  telegramChannel?: string;
  xProfile?: string;
  referrals?: Array<{
    id: string;
    referralLink: string;
    referralCode: string;
  }>;
}

interface DashboardStats {
  partner: Partner;
  totalReferrals: number;
  totalEarnings: string;
  pendingEarnings: string;
  completedEarnings: string;
  totalVerifiedClaims: number;
  activeUsersLast30Days: number;
}

interface PartnerDashboardProps {
  partner: Partner;
}

function formatEpwx(value: string | number): string {
  const num = typeof value === "string" ? BigInt(value) : BigInt(value);
  const divisor = BigInt("1000000000"); // 10^9 for 9 decimals
  const wholeEpwx = num / divisor;
  return wholeEpwx.toLocaleString();
}

export default function PartnerDashboard({
  partner,
}: PartnerDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [referralLink, setReferralLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/partners/${partner.id}/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        const latestReferralLink = data?.stats?.partner?.referrals?.[0]?.referralLink;
        if (latestReferralLink) {
          setReferralLink(latestReferralLink);
        }
      } else {
        toast.error("Failed to load dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("An error occurred while loading stats");
    }
  };

  useEffect(() => {
    fetchStats();
    setLoading(false);
  }, [partner.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success("Stats refreshed");
  };

  const handleGenerateReferralLink = async () => {
    try {
      setGeneratingLink(true);
      const response = await fetch(`/api/partners/${partner.id}/generate-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: partner.walletAddress }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to generate referral link");
        return;
      }

      setReferralLink(data.referral.referralLink);
      toast.success("Referral link ready");
    } catch (error) {
      console.error("Error generating referral link:", error);
      toast.error("Failed to generate referral link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyReferralLink = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied");
    } catch (error) {
      console.error("Copy referral link failed:", error);
      toast.error("Unable to copy referral link");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="inline-flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">{partner.name}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Status: <span className="font-semibold text-green-400">{partner.status}</span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Earnings */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm font-semibold text-slate-400">Total Earnings</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {formatEpwx(stats.totalEarnings)}
              </p>
              <p className="mt-1 text-xs text-slate-500">EPWX</p>
            </div>

            {/* Pending Earnings */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6">
              <p className="text-sm font-semibold text-amber-300">Pending Earnings</p>
              <p className="mt-2 text-2xl font-bold text-amber-100">
                {formatEpwx(stats.pendingEarnings)}
              </p>
              <p className="mt-1 text-xs text-amber-300/70">
                Awaiting settlement (7-day hold)
              </p>
            </div>

            {/* Completed Earnings */}
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-6">
              <p className="text-sm font-semibold text-green-300">Completed Earnings</p>
              <p className="mt-2 text-2xl font-bold text-green-100">
                {formatEpwx(stats.completedEarnings)}
              </p>
              <p className="mt-1 text-xs text-green-300/70">Ready for claim</p>
            </div>

            {/* Total Referrals */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
              <p className="text-sm font-semibold text-blue-300">Total Referrals</p>
              <p className="mt-2 text-2xl font-bold text-blue-100">
                {stats.totalReferrals}
              </p>
              <p className="mt-1 text-xs text-blue-300/70">Users referred</p>
            </div>

            {/* Total Verified Claims */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-6">
              <p className="text-sm font-semibold text-purple-300">Verified Claims</p>
              <p className="mt-2 text-2xl font-bold text-purple-100">
                {stats.totalVerifiedClaims}
              </p>
              <p className="mt-1 text-xs text-purple-300/70">
                {stats.totalVerifiedClaims > 0
                  ? `Avg: ${(BigInt(stats.totalEarnings) / BigInt(stats.totalVerifiedClaims || 1)).toLocaleString()} per claim`
                  : "No claims yet"}
              </p>
            </div>

            {/* Active Users Last 30 Days */}
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-6">
              <p className="text-sm font-semibold text-cyan-300">Active Last 30d</p>
              <p className="mt-2 text-2xl font-bold text-cyan-100">
                {stats.activeUsersLast30Days}
              </p>
              <p className="mt-1 text-xs text-cyan-300/70">Users claiming</p>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
            <h3 className="mb-3 font-semibold text-slate-200">Wallet Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Payout Wallet:</p>
                <p className="mt-1 break-all font-mono text-cyan-400">
                  {partner.walletAddress}
                </p>
              </div>
              {partner.telegramChannel && (
                <div>
                  <p className="text-slate-400">Telegram Channel:</p>
                  <p className="mt-1 text-slate-300">{partner.telegramChannel}</p>
                </div>
              )}
              {partner.xProfile && (
                <div>
                  <p className="text-slate-400">X/Twitter:</p>
                  <p className="mt-1 text-slate-300">{partner.xProfile}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
            <h3 className="mb-3 font-semibold text-blue-100">Partner Referral Link</h3>
            <p className="mb-3 text-xs text-blue-200/80">
              Share this link so users can claim with your partner referral code.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={referralLink || "Generate your referral link to start sharing"}
                className="w-full rounded-lg border border-blue-400/30 bg-slate-900/60 px-3 py-2 text-sm text-blue-100"
              />
              <button
                onClick={handleGenerateReferralLink}
                disabled={generatingLink}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {generatingLink ? "Generating..." : "Generate"}
              </button>
              <button
                onClick={handleCopyReferralLink}
                disabled={!referralLink}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Earnings Table */}
          <PartnerEarningsTable partnerId={partner.id} />
        </>
      )}
    </div>
  );
}
