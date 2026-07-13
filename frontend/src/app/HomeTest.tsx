"use client";
import Link from "next/link";
import { EPWXCashbackClaim } from "@/components/EPWXCashbackClaim_clean";
import { HomeSwapCard } from "@/components/HomeSwapCard";
import { TokenSupplyPieChart } from "@/components/TokenSupplyPieChart";
import { parseJsonResponse } from "@/utils/apiErrors";
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

const themedSectionClass = "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8";
const themedInnerClass = "relative z-10";
const glassPanelClass = "rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-lg";
const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || "0xef5f5751cf3eca6cc3572768298b7783d33d60eb";
const DEFAULT_DAILY_REWARD = 100_000;
const MID_TIER_DAILY_REWARD = 2_000_000;
const BONUS_DAILY_REWARD = 5_000_000;
const MEGA_DAILY_REWARD = 10_000_000;
const MID_TIER_DAILY_REWARD_THRESHOLD = 10_000_000_000;
const BONUS_DAILY_REWARD_THRESHOLD = 100_000_000_000;
const MEGA_DAILY_REWARD_THRESHOLD = 1_000_000_000_000;
const TELEGRAM_VERIFICATION_RECHECK_INTERVAL_MS = 60_000;
const LATEST_WINNERS_REFRESH_INTERVAL_MS = 60_000;
const NEXT_DRAW_COUNTDOWN_REFRESH_INTERVAL_MS = 1_000;
const DEFAULT_AUTO_DAILY_DRAW_TIME_UTC = "00:05";
const NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC = String(process.env.NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC || DEFAULT_AUTO_DAILY_DRAW_TIME_UTC).trim();
const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "epwx_bot";
const PENDING_REFERRAL_STORAGE_KEY = "epwx-pending-referrer";
const PENDING_PARTNER_REFERRAL_CODE_STORAGE_KEY = "epwx-pending-partner-referral-code";
const HOME_SHORTCUT_SECTIONS = ['buy-epwx', 'burnt-supply', 'latest-winners', 'daily-claim'] as const;
const DAILY_REWARD_TIERS = [
  {
    walletBalanceLabel: `At least ${MEGA_DAILY_REWARD_THRESHOLD.toLocaleString()} EPWX`,
    rewardLabel: `${MEGA_DAILY_REWARD.toLocaleString()} EPWX`,
  },
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
  totalClaimsTillNow: number;
  totalEpwxDistributedTillNow: number;
}

interface LatestDailyDraw {
  id: number;
  drawDate: string;
  winnerCount: number;
  eligibleCount: number;
  prizeAmount: string;
}

interface LatestDailyDrawWinner {
  id: number;
  wallet: string;
  rank: number;
  prizeAmount: string;
  status: string;
  txHash?: string | null;
}

interface LatestDailyDrawPagination {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

interface BuyerBadge {
  variant: 'whale' | 'tier' | 'buyer';
  label: string;
  accentClassName: string;
  description: string;
  benefit: string;
}

type HomeShortcutSection = typeof HOME_SHORTCUT_SECTIONS[number];

function BuyerBadgeIcon({ variant }: { variant: BuyerBadge['variant'] }) {
  if (variant === 'whale') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M4 18h16v2H4v-2Zm1.2-10.4 3.55 2.42L12 4.5l3.25 5.52 3.55-2.42-1.68 7.4H6.88L5.2 7.6Z" />
      </svg>
    );
  }

  if (variant === 'tier') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M12 2 5 5v6c0 4.65 2.98 8.99 7 10 4.02-1.01 7-5.35 7-10V5l-7-3Zm0 4.2 3.5 1.5V11c0 2.7-1.5 5.25-3.5 6.55C10 16.25 8.5 13.7 8.5 11V7.7L12 6.2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 3.5 14.63 8.83l5.87.85-4.25 4.14 1 5.85L12 16.9l-5.25 2.77 1-5.85L3.5 9.68l5.87-.85L12 3.5Z" />
    </svg>
  );
}

function BuyerBadgeChip({ badge, compact = false }: { badge: BuyerBadge; compact?: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border font-black uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm',
        compact ? 'px-3 py-1.5 text-[11px] tracking-[0.18em]' : 'px-3.5 py-2 text-xs tracking-[0.16em]',
        badge.accentClassName,
      ].join(' ')}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 ring-1 ring-white/15">
        <BuyerBadgeIcon variant={badge.variant} />
      </span>
      <span>{badge.label}</span>
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M15 8a3 3 0 1 0-2.82-4H12a3 3 0 0 0 .18 1.01L7.91 7.25A3 3 0 0 0 6 6.5a3 3 0 1 0 1.91 5.32l4.27 2.24A3 3 0 0 0 12 15a3 3 0 1 0 .18 1.01l-4.27 2.24A3 3 0 1 0 6 17.5a3 3 0 0 0 1.91-.75l4.27-2.24A3 3 0 0 0 15 15a3 3 0 1 0 0-6Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-7.39L5.6 22H2.48l7.24-8.28L1.7 2h6.39l4.42 6.76L18.9 2Zm-1.09 18h1.73L7.13 3.9H5.27L17.81 20Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M21.94 4.66a1.5 1.5 0 0 0-1.72-.23L3.05 12.47a1.5 1.5 0 0 0 .15 2.77l4.05 1.52 1.52 4.05a1.5 1.5 0 0 0 2.77.15l8.04-17.17a1.5 1.5 0 0 0-.64-.63ZM9.04 15.39l-.55 3.2-1.06-2.81 8.66-7.53-7.05 7.14Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12 2a10 10 0 0 0-8.67 14.99L2 22l5.18-1.28A10 10 0 1 0 12 2Zm0 18.18a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-3.07.76.82-2.99-.2-.31A8.18 8.18 0 1 1 12 20.18Zm4.49-6.07c-.25-.12-1.47-.73-1.7-.82-.23-.08-.4-.12-.57.13-.16.25-.65.82-.79.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.37-.78-1.88-.2-.48-.41-.42-.57-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.12.17 1.76 2.69 4.25 3.77.59.25 1.04.39 1.4.5.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.17.21-.58.21-1.07.15-1.17-.06-.09-.23-.15-.48-.27Z" />
    </svg>
  );
}

interface TwitterCampaign {
  id: number;
  code: string;
  title: string;
  taskType: 'retweet' | 'comment' | 'poll';
  tweetUrl: string;
  rewardAmount?: string | null;
  expiresAt?: string | null;
  claimStatus?: 'pending' | 'paid' | null;
}

function getTwitterTaskLabel(taskType: 'retweet' | 'comment' | 'poll') {
  switch (taskType) {
    case 'comment':
      return 'Comment';
    case 'poll':
      return 'Poll';
    default:
      return 'Retweet';
  }
}

function getTwitterTaskIcon(taskType: 'retweet' | 'comment' | 'poll') {
  switch (taskType) {
    case 'comment':
      return '💬';
    case 'poll':
      return '📊';
    default:
      return '🔁';
  }
}

function getTwitterTaskAction(taskType: 'retweet' | 'comment' | 'poll') {
  switch (taskType) {
    case 'comment':
      return 'Comment & Upload Screenshot';
    case 'poll':
      return 'Vote In Poll & Upload Screenshot';
    default:
      return 'Retweet & Upload Screenshot';
  }
}

interface CampaignPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReferralRewardStatus {
  status: string;
  rewardAmount?: string;
  reason?: string;
  referrerRewardStatus?: string;
  referredRewardStatus?: string;
}

interface ReferralStatsResponse {
  stats?: {
    totalRegistered?: number;
    pending?: number;
    qualified?: number;
    blocked?: number;
    referrerRewardsPaid?: number;
  };
  sentReferrals?: Array<{
    id: number;
    referredWallet: string;
    status: string;
    rewardAmount: string;
    referrerRewardStatus: string;
    referredRewardStatus: string;
    qualifiedAt?: string | null;
    createdAt?: string | null;
    disqualificationReason?: string | null;
  }>;
  referredBy?: {
    id: number;
    referrerWallet: string;
    status: string;
    rewardAmount: string;
    referrerRewardStatus: string;
    referredRewardStatus: string;
    qualifiedAt?: string | null;
    disqualificationReason?: string | null;
  } | null;
}

function formatReferralRewardMessage(reward?: ReferralRewardStatus | null) {
  if (!reward) {
    return null;
  }

  if (reward.status === "blocked") {
    return reward.reason || "Referral reward was blocked because both wallets used the same IP address.";
  }

  const amount = Number(reward.rewardAmount || "1000000").toLocaleString();
  if (reward.referrerRewardStatus === "paid" && reward.referredRewardStatus === "paid") {
    return `Referral bonus complete. Both wallets received ${amount} EPWX.`;
  }

  return `Referral bonus qualified for ${amount} EPWX per wallet. Distribution status: referrer ${reward.referrerRewardStatus || "pending"}, referred ${reward.referredRewardStatus || "pending"}.`;
}

function buildReferralShareText(referralLink: string) {
  return `Join me on EPWX Task Hub and use my referral link to qualify for EPWX rewards: ${referralLink}`;
}

function buildReferralShareBody() {
  return "Join me on EPWX Task Hub and use my referral link to qualify for EPWX rewards:";
}

function isWalletInAppBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /(MetaMask|Trust|TokenPocket|CoinbaseWallet|BitKeep|OKApp|imToken|SafePal)/i.test(navigator.userAgent);
}

function isMobileBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function getReferralShareLinks(referralLink: string) {
  const shareText = buildReferralShareText(referralLink);
  const encodedLink = encodeURIComponent(referralLink);
  const encodedShareText = encodeURIComponent(shareText);

  return {
    x: `https://twitter.com/intent/tweet?text=${encodedShareText}`,
    telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedShareText}`,
    whatsappWeb: `https://api.whatsapp.com/send?text=${encodedShareText}`,
  };
}

function shouldUseWhatsAppCopyFallback() {
  return isWalletInAppBrowser() || isMobileBrowser();
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

function parseUtcHourMinute(input: string) {
  const matched = String(input || "").match(/^(\d{2}):(\d{2})$/);
  if (!matched) {
    return { hour: 0, minute: 5 };
  }

  const hour = Number.parseInt(matched[1], 10);
  const minute = Number.parseInt(matched[2], 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: 0, minute: 5 };
  }

  return { hour, minute };
}

function getNextDrawAtUtc(now = new Date()) {
  const { hour, minute } = parseUtcHourMinute(NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC);
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hour,
    minute,
    0,
    0,
  ));

  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next;
}

function formatUtcDateTime(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
}

function buildDailyDrawShareText(params: {
  draw: LatestDailyDraw;
  nextDrawCountdown: string;
  nextDrawAtUtc: string;
  pageUrl: string;
  referralLink?: string;
  includePageUrl?: boolean;
}) {
  const prizeAmount = Number(params.draw.prizeAmount || '0').toLocaleString();
  const lines = [
    `EPWX Daily Draw ${params.draw.drawDate}`,
    `Winners: ${params.draw.winnerCount}`,
    `Eligible wallets: ${params.draw.eligibleCount}`,
    `Prize per winner: ${prizeAmount} EPWX`,
    `Next draw in: ${params.nextDrawCountdown} (${params.nextDrawAtUtc})`,
  ];

  if (params.includePageUrl) {
    lines.push(`Open: ${params.pageUrl}`);
  }

  if (params.referralLink) {
    lines.push(`My referral link: ${params.referralLink}`);
  }

  return lines.join('\n');
}

function escapeSvgText(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildDailyDrawShareSvg(params: {
  draw: LatestDailyDraw;
  nextDrawCountdown: string;
  nextDrawAtUtc: string;
  pageUrl: string;
}) {
  const prizeAmount = Number(params.draw.prizeAmount || '0').toLocaleString();
  const dateLabel = escapeSvgText(params.draw.drawDate);
  const winnersLabel = escapeSvgText(String(params.draw.winnerCount));
  const eligibleLabel = escapeSvgText(String(params.draw.eligibleCount));
  const prizeLabel = escapeSvgText(`${prizeAmount} EPWX`);
  const countdownLabel = escapeSvgText(params.nextDrawCountdown);
  const nextRunLabel = escapeSvgText(params.nextDrawAtUtc);
  const pageLabel = escapeSvgText(params.pageUrl);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
        <stop stop-color="#1d4ed8"/>
        <stop offset="0.52" stop-color="#7c3aed"/>
        <stop offset="1" stop-color="#db2777"/>
      </linearGradient>
      <linearGradient id="card" x1="120" y1="110" x2="1080" y2="520" gradientUnits="userSpaceOnUse">
        <stop stop-color="rgba(255,255,255,0.22)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0.08)"/>
      </linearGradient>
      <filter id="shadow" x="80" y="80" width="1040" height="470" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="rgba(15,23,42,0.35)"/>
      </filter>
    </defs>
    <rect width="1200" height="630" rx="48" fill="url(#bg)"/>
    <circle cx="130" cy="110" r="95" fill="rgba(255,255,255,0.10)"/>
    <circle cx="1080" cy="520" r="140" fill="rgba(255,255,255,0.08)"/>
    <rect x="90" y="80" width="1020" height="470" rx="40" fill="url(#card)" stroke="rgba(255,255,255,0.18)" filter="url(#shadow)"/>
    <text x="600" y="142" fill="rgba(255,255,255,0.78)" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="6" text-anchor="middle">EPWX DAILY DRAW</text>
    <text x="600" y="208" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="900" text-anchor="middle">${dateLabel}</text>
    <text x="600" y="262" fill="rgba(255,255,255,0.92)" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="500" text-anchor="middle">Winners selected from daily claim wallets</text>

    <rect x="150" y="312" width="900" height="118" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.16)"/>
    <text x="190" y="350" fill="rgba(255,255,255,0.72)" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">WINNERS</text>
    <text x="190" y="390" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900">${winnersLabel}</text>
    <text x="420" y="350" fill="rgba(255,255,255,0.72)" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">ELIGIBLE</text>
    <text x="420" y="390" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900">${eligibleLabel}</text>
    <text x="665" y="350" fill="rgba(255,255,255,0.72)" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">PRIZE PER WINNER</text>
    <text x="665" y="390" fill="#d9f99d" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900">${prizeLabel}</text>

    <rect x="150" y="454" width="900" height="56" rx="18" fill="rgba(15,23,42,0.18)" stroke="rgba(255,255,255,0.14)"/>
    <text x="180" y="489" fill="rgba(255,255,255,0.9)" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700">Next draw in</text>
    <text x="340" y="489" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700">${countdownLabel}</text>
    <text x="600" y="489" fill="rgba(255,255,255,0.75)" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="500" text-anchor="middle">${nextRunLabel}</text>
    <text x="1040" y="489" fill="rgba(255,255,255,0.75)" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="500" text-anchor="end">${pageLabel}</text>
  </svg>`;
}

async function buildDailyDrawShareFile(params: {
  draw: LatestDailyDraw;
  nextDrawCountdown: string;
  nextDrawAtUtc: string;
  pageUrl: string;
}) {
  const svg = buildDailyDrawShareSvg(params);

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to render share image.'));
      img.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context unavailable.');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('Failed to create PNG share image.'));
      }, 'image/png');
    });

    return new File([pngBlob], `epwx-daily-draw-${params.draw.drawDate}.png`, { type: 'image/png' });
  } catch {
    return new File([svg], `epwx-daily-draw-${params.draw.drawDate}.svg`, { type: 'image/svg+xml' });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
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

function formatWalletAddress(wallet: string) {
  if (!wallet) return "-";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 8)}...${wallet.slice(-6)}`;
}

function LatestDailyWinnersBoard({ referralLink }: { referralLink?: string }) {
  const [draw, setDraw] = useState<LatestDailyDraw | null>(null);
  const [winners, setWinners] = useState<LatestDailyDrawWinner[]>([]);
  const [drawPage, setDrawPage] = useState<number>(1);
  const [drawPagination, setDrawPagination] = useState<LatestDailyDrawPagination>({
    page: 1,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [nextDrawCountdown, setNextDrawCountdown] = useState<string>("Calculating...");
  const [nextDrawAtUtc, setNextDrawAtUtc] = useState<string>("");

  const handleShareDailyDraw = async () => {
    if (!draw || typeof window === "undefined") {
      return;
    }

    const pageUrl = `${window.location.origin}/#latest-winners`;
    const shareMessage = buildDailyDrawShareText({
      draw,
      nextDrawCountdown,
      nextDrawAtUtc,
      pageUrl,
      referralLink: referralLink?.trim() || undefined,
    });
    const copyMessage = buildDailyDrawShareText({
      draw,
      nextDrawCountdown,
      nextDrawAtUtc,
      pageUrl,
      referralLink: referralLink?.trim() || undefined,
      includePageUrl: true,
    });
    const shareFile = await buildDailyDrawShareFile({
      draw,
      nextDrawCountdown,
      nextDrawAtUtc,
      pageUrl,
    });
    const shareData = {
      title: "EPWX Daily Draw",
      text: shareMessage,
      url: pageUrl,
      files: [shareFile],
    };

    const supportsFileShare = typeof navigator.canShare === "function" && navigator.canShare({ files: [shareFile] });

    if (typeof navigator.share !== "function" || !supportsFileShare) {
      try {
        await navigator.clipboard.writeText(copyMessage);
        toast.success("Daily draw details copied. Paste them anywhere to share.");
      } catch {
        const objectUrl = URL.createObjectURL(shareFile);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = shareFile.name;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        toast.success("Share image downloaded. Attach it when posting your draw.");
      }
      return;
    }

    try {
      await navigator.share(shareData);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(copyMessage);
          toast.success("Daily draw details copied. Paste them anywhere to share.");
        } catch {
          toast.error("Unable to share the daily draw right now.");
        }
      }
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextDrawAt = getNextDrawAtUtc(now);
      const msRemaining = Math.max(nextDrawAt.getTime() - now.getTime(), 0);
      setNextDrawCountdown(formatDuration(msRemaining));
      setNextDrawAtUtc(formatUtcDateTime(nextDrawAt));
    };

    updateCountdown();
    const timerId = window.setInterval(updateCountdown, NEXT_DRAW_COUNTDOWN_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestWinners = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetch(`/api/epwx/daily-draws/latest?page=${drawPage}`, { cache: 'no-store' });
        const data = await parseJsonResponse<{
          draw?: LatestDailyDraw | null;
          winners?: LatestDailyDrawWinner[];
          pagination?: LatestDailyDrawPagination;
        }>(
          response,
          'Failed to load latest winners.'
        );
        if (!isMounted) {
          return;
        }
        setDraw(data.draw || null);
        setWinners(Array.isArray(data.winners) ? data.winners : []);
        const nextPagination: LatestDailyDrawPagination = {
          page: Math.max(1, Number(data.pagination?.page || 1)),
          totalPages: Math.max(1, Number(data.pagination?.totalPages || 1)),
          hasPrevPage: Boolean(data.pagination?.hasPrevPage),
          hasNextPage: Boolean(data.pagination?.hasNextPage),
        };
        setDrawPagination(nextPagination);
        if (nextPagination.page !== drawPage) {
          setDrawPage(nextPagination.page);
        }
        setLastUpdatedAt(new Date().toLocaleTimeString());
      } catch (fetchError: any) {
        if (!isMounted) {
          return;
        }
        setDraw(null);
        setWinners([]);
        setDrawPagination({
          page: 1,
          totalPages: 1,
          hasPrevPage: false,
          hasNextPage: false,
        });
        setError(fetchError?.message || 'Failed to load latest winners.');
      } finally {
        if (!silent && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLatestWinners();
    const intervalId = window.setInterval(() => {
      fetchLatestWinners(true);
    }, LATEST_WINNERS_REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [drawPage]);

  return (
    <section id="latest-winners" className="py-12 scroll-mt-24">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-black mb-4 text-slate-100 text-center">Latest Daily Winners</h2>
        <div className={`${themedSectionClass} w-full max-w-5xl`}>
          <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 text-white">
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">Daily Draw Results</p>
              <h3 className="mt-2 text-3xl font-black">Transparent winners for each daily draw</h3>
              <p className="mt-3 text-sm text-white/90">Winners are selected randomly from unique daily claim wallets and listed below with payout status.</p>
              {lastUpdatedAt ? <p className="mt-2 text-xs text-white/85">Auto-refreshes every minute. Last updated: {lastUpdatedAt}</p> : null}
            </div>

            <div className={`${glassPanelClass} mb-5 p-4`}>
              <div className="text-xs uppercase tracking-[0.2em] text-white/80">Next Draw Countdown</div>
              <div className="mt-1 text-2xl font-black text-emerald-100">{nextDrawCountdown}</div>
              <div className="mt-1 text-xs text-white/85">Next scheduled run: {nextDrawAtUtc || "-"}</div>
              <div className="mt-1 text-xs text-white/80">Schedule source: {NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC} UTC</div>
            </div>

            {loading ? <div className="text-center text-white/90">Loading latest winners...</div> : null}
            {!loading && error ? <div className="text-center text-red-200">{error}</div> : null}
            {!loading && !error && !draw ? <div className="text-center text-white/90">No draw has been completed yet.</div> : null}

            {!loading && !error && draw ? (
              <>
                <div className={`${glassPanelClass} mb-5 p-4 text-sm text-white/95`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-white/80">Draw Date</div>
                      <div className="mt-1 text-xl font-black text-white">{draw.drawDate}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleShareDailyDraw}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/20"
                    >
                      <ShareIcon />
                      Share Draw
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div>Winners: <span className="font-bold text-white">{draw.winnerCount}</span></div>
                    <div>Eligible Wallets: <span className="font-bold text-white">{draw.eligibleCount}</span></div>
                    <div>Prize Per Winner: <span className="font-bold text-emerald-100">{Number(draw.prizeAmount || '0').toLocaleString()} EPWX</span></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setDrawPage((current) => Math.max(1, current - 1))}
                      disabled={!drawPagination.hasPrevPage}
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40"
                    >
                      Prev Draw
                    </button>
                    <span className="text-xs font-semibold text-white/80">Draw Page {drawPagination.page} of {drawPagination.totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setDrawPage((current) => current + 1)}
                      disabled={!drawPagination.hasNextPage}
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40"
                    >
                      Next Draw
                    </button>
                  </div>
                </div>

                {winners.length === 0 ? (
                  <div className="text-center text-white/90">No winners available for this draw yet.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {winners
                      .slice()
                      .sort((a, b) => a.rank - b.rank)
                      .map((winner) => (
                        <div key={winner.id} className={`${glassPanelClass} p-4`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-black text-white">Winner #{winner.rank}</div>
                            <span className={`ui-status ${winner.status === 'paid' ? 'ui-status-success' : 'ui-status-warning'}`}>
                              {winner.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-white/95 break-all">Wallet: {formatWalletAddress(winner.wallet)}</div>
                          <div className="mt-1 text-sm text-white/90">Prize: {Number(winner.prizeAmount || '0').toLocaleString()} EPWX</div>
                          {winner.txHash ? (
                            <a
                              href={`https://basescan.org/tx/${winner.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 block text-xs text-emerald-50 underline decoration-emerald-100/80 underline-offset-2 hover:text-white break-all"
                            >
                              View Transaction
                            </a>
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomeTest() {
  const { address, isConnected } = useAccount();
  const [incomingReferralWallet, setIncomingReferralWallet] = useState<string | null>(null);
  const [incomingPartnerReferralCode, setIncomingPartnerReferralCode] = useState<string | null>(null);
  const { data: epwxBalance, isLoading: balanceLoading } = useBalance({
    address,
    token: EPWX_TOKEN_ADDRESS,
    chainId: base.id,
  });
  const normalizedEpwxBalance = Number(epwxBalance?.formatted || 0);
  const currentDailyReward = normalizedEpwxBalance >= MEGA_DAILY_REWARD_THRESHOLD
    ? MEGA_DAILY_REWARD
    : normalizedEpwxBalance >= BONUS_DAILY_REWARD_THRESHOLD
    ? BONUS_DAILY_REWARD
    : normalizedEpwxBalance >= MID_TIER_DAILY_REWARD_THRESHOLD
      ? MID_TIER_DAILY_REWARD
      : DEFAULT_DAILY_REWARD;
  const nextTierTarget = normalizedEpwxBalance >= MEGA_DAILY_REWARD_THRESHOLD
    ? null
    : normalizedEpwxBalance >= BONUS_DAILY_REWARD_THRESHOLD
      ? MEGA_DAILY_REWARD_THRESHOLD
    : normalizedEpwxBalance >= MID_TIER_DAILY_REWARD_THRESHOLD
      ? BONUS_DAILY_REWARD_THRESHOLD
      : MID_TIER_DAILY_REWARD_THRESHOLD;
  const nextTierReward = nextTierTarget === MEGA_DAILY_REWARD_THRESHOLD
    ? MEGA_DAILY_REWARD
    : nextTierTarget === BONUS_DAILY_REWARD_THRESHOLD
    ? BONUS_DAILY_REWARD
    : nextTierTarget === MID_TIER_DAILY_REWARD_THRESHOLD
      ? MID_TIER_DAILY_REWARD
      : null;
  const tokensToNextTier = nextTierTarget === null
    ? 0
    : Math.max(nextTierTarget - normalizedEpwxBalance, 0);

  const [specialEligible, setSpecialEligible] = useState(false);
  const [specialClaiming, setSpecialClaiming] = useState(false);
  const [specialClaimStatus, setSpecialClaimStatus] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStatsResponse | null>(null);
  const [referralStatus, setReferralStatus] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState("");
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
  const [showClaimUpgradePrompt, setShowClaimUpgradePrompt] = useState(false);
  const [nextDailyClaimAt, setNextDailyClaimAt] = useState<number | null>(null);
  const [remainingClaimTime, setRemainingClaimTime] = useState<string | null>(null);
  const [hasDailyClaimHistory, setHasDailyClaimHistory] = useState(false);
  const [hasRecentQualifyingPurchase, setHasRecentQualifyingPurchase] = useState(false);
  const [dailyClaimsSummary, setDailyClaimsSummary] = useState<DailyClaimsSummary | null>(null);
  const [dailyClaimsSummaryLoading, setDailyClaimsSummaryLoading] = useState(true);
  const [isTelegramVerified, setIsTelegramVerified] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [specialAgreed, setSpecialAgreed] = useState(false);
  const [showSpecialTerms, setShowSpecialTerms] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [activeShortcutSection, setActiveShortcutSection] = useState<HomeShortcutSection>('daily-claim');

  useEffect(() => {
    const syncShortcutSectionFromHash = () => {
      const currentHash = window.location.hash.replace('#', '');
      if (HOME_SHORTCUT_SECTIONS.includes(currentHash as HomeShortcutSection)) {
        setActiveShortcutSection(currentHash as HomeShortcutSection);
      }
    };

    syncShortcutSectionFromHash();

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((entryA, entryB) => entryB.intersectionRatio - entryA.intersectionRatio)[0];

        if (visibleEntry?.target.id && HOME_SHORTCUT_SECTIONS.includes(visibleEntry.target.id as HomeShortcutSection)) {
          setActiveShortcutSection(visibleEntry.target.id as HomeShortcutSection);
        }
      },
      {
        rootMargin: '-20% 0px -45% 0px',
        threshold: [0.2, 0.35, 0.5, 0.7],
      }
    );

    HOME_SHORTCUT_SECTIONS.forEach((sectionId) => {
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement) {
        observer.observe(sectionElement);
      }
    });

    window.addEventListener('hashchange', syncShortcutSectionFromHash);

    return () => {
      window.removeEventListener('hashchange', syncShortcutSectionFromHash);
      observer.disconnect();
    };
  }, []);

  const fetchReferralStats = async (wallet: string) => {
    try {
      const res = await fetch(`/api/epwx/wallet-referrals/stats?wallet=${wallet}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load referral stats");
      }
      setReferralStats(data);
      if (typeof window !== "undefined") {
        setReferralLink(`${window.location.origin}/?ref=${wallet.toLowerCase()}`);
      }
    } catch (error: any) {
      setReferralStats(null);
      setReferralStatus((currentValue) => currentValue || error?.message || "Failed to load referral data.");
      if (typeof window !== "undefined") {
        setReferralLink(`${window.location.origin}/?ref=${wallet.toLowerCase()}`);
      }
    }
  };

  const buyerBadge: BuyerBadge | null = normalizedEpwxBalance >= MEGA_DAILY_REWARD_THRESHOLD
    ? {
        variant: 'whale',
        label: 'Whale Buyer',
        accentClassName: 'border-amber-200/50 bg-gradient-to-r from-amber-300/35 via-yellow-300/30 to-amber-100/25 text-amber-50',
        description: 'Top-tier buyer status for wallets holding at least 1,000,000,000,000 EPWX.',
        benefit: 'Unlocks the highest daily claim tier at 10,000,000 EPWX per claim.',
      }
    : normalizedEpwxBalance >= BONUS_DAILY_REWARD_THRESHOLD
      ? {
          variant: 'tier',
          label: 'Tier Buyer',
          accentClassName: 'border-emerald-200/50 bg-gradient-to-r from-emerald-300/30 via-teal-300/25 to-cyan-200/25 text-emerald-50',
          description: 'Committed buyer status for wallets holding at least 100,000,000,000 EPWX.',
          benefit: 'Qualifies the wallet for stronger daily reward progression and buyer positioning.',
        }
      : hasRecentQualifyingPurchase
        ? {
            variant: 'buyer',
            label: 'Buyer',
            accentClassName: 'border-sky-200/50 bg-gradient-to-r from-sky-300/30 via-cyan-300/25 to-indigo-200/25 text-sky-50',
            description: 'Verified buyer status for wallets with a recent qualifying EPWX purchase.',
            benefit: 'Signals purchase activity and points the wallet toward cashback and higher reward tiers.',
          }
        : null;

  useEffect(() => {
    if (!address) {
      setHasRecentQualifyingPurchase(false);
      return;
    }

    let cancelled = false;

    const loadRecentPurchaseStatus = async () => {
      try {
        const res = await fetch(`/api/epwx/eligible?wallet=${address}&hours=3`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) {
          setHasRecentQualifyingPurchase(Array.isArray(data.transactions) && data.transactions.length > 0);
        }
      } catch {
        if (!cancelled) {
          setHasRecentQualifyingPurchase(false);
        }
      }
    };

    loadRecentPurchaseStatus();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const handleCopyReferralLink = async () => {
    if (!referralLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setReferralStatus("Unable to copy the referral link. Please copy it manually.");
    }
  };

  const handleShareReferralLink = async () => {
    if (!referralLink || typeof navigator === "undefined") {
      return;
    }

    const shareMessage = buildReferralShareText(referralLink);

    if (typeof navigator.share !== "function") {
      if (typeof navigator.clipboard !== "undefined") {
        try {
          await navigator.clipboard.writeText(shareMessage);
          setReferralStatus("Referral message copied. Paste it into any app to share your link.");
          return;
        } catch {
          setReferralStatus("Unable to open the share sheet here. Copy the referral link and share it manually.");
          return;
        }
      }

      setReferralStatus("Unable to open the share sheet here. Copy the referral link and share it manually.");
      return;
    }

    try {
      await navigator.share({
        title: "EPWX Task Hub referral",
        text: buildReferralShareBody(),
        url: referralLink,
      });
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast.error("Unable to open the share dialog right now.");
      }
    }
  };

  const handleOpenShareLink = (platform: "x" | "telegram" | "whatsapp") => {
    if (!referralLink || typeof window === "undefined") {
      return;
    }

    const shareLinks = getReferralShareLinks(referralLink);

    if (platform === "whatsapp") {
      const shouldAvoidWhatsAppWeb = shouldUseWhatsAppCopyFallback();

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        navigator.share({
          title: "EPWX Task Hub referral",
          text: buildReferralShareBody(),
          url: referralLink,
        }).catch(async (error: any) => {
          if (error?.name === "AbortError") {
            return;
          }

          if (shouldAvoidWhatsAppWeb && typeof navigator.clipboard !== "undefined") {
            try {
              await navigator.clipboard.writeText(buildReferralShareText(referralLink));
              setReferralStatus("Referral message copied. Open WhatsApp and paste it into your chat.");
              return;
            } catch {
              setReferralStatus("Unable to open WhatsApp directly in this wallet browser. Copy the referral link and share it manually.");
              return;
            }
          }

          window.open(shareLinks.whatsappWeb, "_blank", "noopener,noreferrer");
        });
        return;
      }

      if (shouldAvoidWhatsAppWeb) {
        if (typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined") {
          navigator.clipboard.writeText(buildReferralShareText(referralLink))
            .then(() => {
              setReferralStatus("Referral message copied. Open WhatsApp and paste it into your chat.");
            })
            .catch(() => {
              setReferralStatus("Direct WhatsApp handoff is blocked here. Copy the referral link and share it manually.");
            });
          return;
        }

        setReferralStatus("Direct WhatsApp handoff is blocked here. Copy the referral link and share it manually.");
        return;
      }

      window.open(shareLinks.whatsappWeb, "_blank", "noopener,noreferrer");
      return;
    }

    window.open(shareLinks[platform], "_blank", "noopener,noreferrer");
  };

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
          totalClaimsTillNow: Number(data.totalClaimsTillNow || 0),
          totalEpwxDistributedTillNow: Number(data.totalEpwxDistributedTillNow || 0),
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
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const referralWallet = params.get("ref");
    const partnerCode = params.get("partner");
    setIncomingReferralWallet(referralWallet ? referralWallet.toLowerCase() : null);
    setIncomingPartnerReferralCode(partnerCode ? partnerCode.trim().toUpperCase() : null);
  }, []);

  useEffect(() => {
    if (!incomingReferralWallet || typeof window === "undefined") {
      return;
    }

    localStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, incomingReferralWallet);
    if (!address) {
      setReferralStatus("Referral saved. Connect your wallet, then complete your first daily claim to qualify both wallets for 1,000,000 EPWX.");
    }
  }, [incomingReferralWallet, address]);

  useEffect(() => {
    if (!incomingPartnerReferralCode || typeof window === "undefined") {
      return;
    }

    localStorage.setItem(PENDING_PARTNER_REFERRAL_CODE_STORAGE_KEY, incomingPartnerReferralCode);
    if (!address) {
      setReferralStatus("Partner referral saved. Connect your wallet and complete daily claim to attribute partner reward.");
    }
  }, [incomingPartnerReferralCode, address]);

  useEffect(() => {
    if (!address) {
      setReferralStats(null);
      setReferralLink("");
      return;
    }

    let cancelled = false;

    const syncReferralState = async () => {
      const normalizedWallet = address.toLowerCase();
      if (typeof window !== "undefined") {
        setReferralLink(`${window.location.origin}/?ref=${normalizedWallet}`);
      }

      const pendingReferralWallet = typeof window !== "undefined"
        ? localStorage.getItem(PENDING_REFERRAL_STORAGE_KEY)
        : null;

      if (pendingReferralWallet) {
        if (pendingReferralWallet === normalizedWallet) {
          localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
          if (!cancelled) {
            setReferralStatus("Self-referral is not allowed.");
          }
        } else {
          try {
            const res = await fetch("/api/epwx/wallet-referrals/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                referrerWallet: pendingReferralWallet,
                referredWallet: normalizedWallet,
              }),
            });
            const data = await res.json();
            if (!cancelled) {
              setReferralStatus(
                res.ok
                  ? "Referral linked. Complete your first daily claim to unlock the 1,000,000 EPWX reward for both wallets."
                  : (data.error || "Unable to register referral.")
              );
            }
          } catch {
            if (!cancelled) {
              setReferralStatus("Unable to register referral right now. Try reconnecting and claiming again.");
            }
          } finally {
            localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
          }
        }
      }

      try {
        const res = await fetch(`/api/epwx/wallet-referrals/stats?wallet=${normalizedWallet}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          if (res.ok) {
            setReferralStats(data);
          } else {
            setReferralStats(null);
          }
        }
      } catch {
        if (!cancelled) {
          setReferralStats(null);
        }
      }
    };

    syncReferralState();

    return () => {
      cancelled = true;
    };
  }, [address, claimStatus]);

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

    const intervalId = isTelegramVerified
      ? null
      : window.setInterval(checkVerification, TELEGRAM_VERIFICATION_RECHECK_INTERVAL_MS);

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
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
    if (!address) {
      setClaimStatus("Connect your wallet first.");
      return;
    }

    setClaiming(true);
    setClaimStatus(null);
    setShowClaimUpgradePrompt(false);
    try {
      const normalizedWallet = address.toLowerCase();
      const partnerReferralCode = typeof window !== "undefined"
        ? (localStorage.getItem(PENDING_PARTNER_REFERRAL_CODE_STORAGE_KEY) || incomingPartnerReferralCode)
        : incomingPartnerReferralCode;
      const todayUtc = new Date(Date.now()).toISOString().slice(0, 10);
      const message = `EPWX Daily Claim for ${normalizedWallet} on ${todayUtc}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/epwx/daily-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: normalizedWallet,
          signature,
          ...(partnerReferralCode ? { referralCode: partnerReferralCode } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const claimedAmount = Number(data.amount || DEFAULT_DAILY_REWARD).toLocaleString();
        const referralMessage = formatReferralRewardMessage(data.referralReward);
        const partnerMessage = data.partnerReward?.partnerName
          ? ` Partner reward attributed to ${data.partnerReward.partnerName}.`
          : "";
        setClaimStatus(
          referralMessage
            ? `Successfully claimed ${claimedAmount} EPWX! Your reward will be sent soon. ${referralMessage}${partnerMessage}`
            : `Successfully claimed ${claimedAmount} EPWX! Your reward will be sent soon.${partnerMessage}`
        );
        if (partnerReferralCode && typeof window !== "undefined") {
          localStorage.removeItem(PENDING_PARTNER_REFERRAL_CODE_STORAGE_KEY);
        }
        if (nextTierTarget) {
          setShowClaimUpgradePrompt(true);
        }
        fetchDailyClaimsSummary();
        if (address) {
          fetchReferralStats(address);
        }
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

  const shareOptions = [
    {
      key: "x" as const,
      label: "X",
      title: "Share on X",
      icon: <XIcon />,
      buttonClassName: "border-sky-200/25 bg-sky-400/10 text-sky-50 hover:bg-sky-400/20",
    },
    {
      key: "telegram" as const,
      label: "Telegram",
      title: "Share on Telegram",
      icon: <TelegramIcon />,
      buttonClassName: "border-cyan-200/25 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/20",
    },
    {
      key: "whatsapp" as const,
      label: shouldUseWhatsAppCopyFallback() ? "Copy for WhatsApp" : "WhatsApp",
      title: shouldUseWhatsAppCopyFallback() ? "Copy for WhatsApp" : "Share on WhatsApp",
      icon: <WhatsAppIcon />,
      buttonClassName: "border-emerald-200/25 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/20",
    },
  ];

  const primaryNavItems: Array<{ label: string; href: string; external?: boolean }> = [
    { label: "Home", href: "/" },
    { label: "Whitepaper", href: "/whitepaper" },
    { label: "Platform Stats", href: "/platform-stats" },
    { label: "Daily Draws", href: "#latest-winners" },
    { label: "Claim Center", href: "/claim" },
    { label: "Merchant Admin", href: "/admin/merchants" },
  ];

  const quickRailItems: Array<{ label: string; href: string }> = [
    { label: "Wallet", href: "#wallet-verification" },
    { label: "Buy EPWX", href: "#buy-epwx" },
    { label: "Burnt Supply", href: "#burnt-supply" },
    { label: "Daily Draw", href: "#latest-winners" },
    { label: "Daily Claim", href: "#daily-claim" },
  ];

  const shortcutActionItems: Array<{ section: HomeShortcutSection; label: string; href: string; eyebrow: string }> = [
    { section: 'buy-epwx', label: 'Buy EPWX', href: '#buy-epwx', eyebrow: 'Swap' },
    { section: 'burnt-supply', label: 'Burnt Supply', href: '#burnt-supply', eyebrow: 'Tokenomics' },
    { section: 'latest-winners', label: 'Next Draw', href: '#latest-winners', eyebrow: 'Rewards' },
    { section: 'daily-claim', label: 'Daily Claim', href: '#daily-claim', eyebrow: 'Claim' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-950 text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute -right-28 top-12 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[150px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90">EPWX Task Hub</span>
          </Link>
          <nav className="hidden items-center gap-2 lg:flex">
            {primaryNavItems.map((item) => (
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </a>
              ) : item.href.startsWith("#") ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>
          <div className="hidden lg:block">
            <ConnectKitButton />
          </div>
          <div className="lg:hidden">
            <Link
              href="#wallet-verification"
              className="rounded-full border border-emerald-300/40 bg-emerald-400/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-100"
            >
              Open Wallet
            </Link>
          </div>
        </div>
      </header>

      <section className="sticky top-[73px] z-20 hidden border-b border-white/10 bg-slate-950/70 backdrop-blur-xl lg:block">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Quick Actions</div>
            <div className="mt-1 text-sm text-slate-300">Use the desktop action strip instead of floating edge rails.</div>
          </div>
          <div className="ml-auto grid flex-1 grid-cols-4 gap-3">
            {shortcutActionItems.map((item) => (
              <a
                key={item.section}
                href={item.href}
                onClick={() => setActiveShortcutSection(item.section)}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${activeShortcutSection === item.section ? 'border-emerald-300/40 bg-emerald-400/18 text-emerald-50' : 'border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]'}`}
              >
                <div className={`text-[10px] font-black uppercase tracking-[0.22em] ${activeShortcutSection === item.section ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                  {item.eyebrow}
                </div>
                <div className="mt-1 text-sm font-bold uppercase tracking-[0.08em]">{item.label}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 pb-28 pt-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:pb-12 lg:pt-10">
        <aside className="hidden lg:block">
          <div className="ui-surface-strong sticky top-24 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/50">Quick Navigate</div>
            <div className="space-y-2">
              {quickRailItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="ui-btn-muted block rounded-2xl px-3 py-2 text-xs uppercase tracking-[0.12em]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </aside>
        <div className="min-w-0">
        {/* Wallet Connection & Verification Section */}
        <section id="wallet-verification" className="my-8 scroll-mt-24">
          <div className={`${themedSectionClass} mb-6 w-full max-w-5xl mx-auto`}>
            <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className={themedInnerClass}>
            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Account Control</p>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Wallet and verification</h2>
                <p className="mt-2 text-sm text-slate-300">Use this panel to connect your wallet, verify Telegram access, and manage referral sharing.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">
                  <div className="uppercase tracking-[0.14em] text-slate-400">Current Tier</div>
                  <div className="mt-1 font-black text-emerald-200">{currentDailyReward.toLocaleString()} EPWX</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">
                  <div className="uppercase tracking-[0.14em] text-slate-400">Claim Window</div>
                  <div className="mt-1 font-black text-cyan-200">{remainingClaimTime ? remainingClaimTime : "Available"}</div>
                </div>
              </div>
            </div>
            {!address ? (
              <div className="flex flex-col items-center w-full">
                <span className="mb-2 text-white/80 text-center">Please connect your wallet to access all features.</span>
                <div className="mb-4 max-w-sm rounded-2xl border border-white/15 bg-white/10 p-4 text-center text-sm text-white/80">
                  Connecting lets EPWX read your public wallet address so claims, rewards, and account-linked features can work correctly. Connecting does not move funds or approve token spending.
                </div>
                <ConnectKitButton />
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={`${glassPanelClass} p-4 sm:col-span-2`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Connected wallet</div>
                    <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs font-mono text-slate-200 break-all" style={{wordBreak: 'break-all'}}>{address}</div>
                  </div>
                  <div className={`${glassPanelClass} p-4`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Telegram status</div>
                    {checkingVerification ? (
                      <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-300">Checking...</div>
                    ) : isTelegramVerified ? (
                      <div className="ui-status ui-status-success mt-2">Verified</div>
                    ) : isTelegramVerified === null ? (
                      <div className="ui-status ui-status-warning mt-2">Unknown</div>
                    ) : (
                      <div className="ui-status ui-status-danger mt-2">Not verified</div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={`${glassPanelClass} p-4`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">EPWX balance</div>
                    <div className="mt-2 text-xl font-black text-emerald-200">{balanceLoading ? "Loading..." : `${formattedBalance} EPWX`}</div>
                  </div>
                  <div className={`${glassPanelClass} p-4`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Next tier target</div>
                    <div className="mt-2 text-sm font-bold text-slate-100">{nextTierTarget ? `${nextTierTarget.toLocaleString()} EPWX` : "Top tier active"}</div>
                  </div>
                  <div className={`${glassPanelClass} p-4`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tokens to next tier</div>
                    <div className="mt-2 text-sm font-bold text-cyan-200">{nextTierTarget ? `${formatEpwxBalance(tokensToNextTier)} EPWX` : "0 EPWX"}</div>
                  </div>
                </div>

                <div className={`w-full p-4 ${glassPanelClass}`}>
                  {buyerBadge ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Buyer Badge</div>
                          <div className="mt-1 text-sm font-semibold text-white">{buyerBadge.description}</div>
                        </div>
                        <BuyerBadgeChip badge={buyerBadge} />
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                        {buyerBadge.benefit}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Buyer Badge</div>
                      <div className="text-sm font-semibold text-white">No buyer badge unlocked yet.</div>
                      <div className="text-sm text-white/75">
                        Complete a qualifying EPWX purchase or build your balance toward 100,000,000,000 EPWX to activate buyer status.
                      </div>
                    </div>
                  )}
                </div>

                <div className={`w-full p-4 ${glassPanelClass}`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Referral</div>
                        <div className="mt-1 text-sm font-semibold text-white">Share your wallet link after connecting</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyReferralLink}
                        disabled={!referralLink}
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {copied ? "Copied" : "Copy Link"}
                      </button>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-slate-950/20 px-3 py-3 text-xs text-white/85 break-all">
                      {referralLink || "Referral link will appear after wallet connection."}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleShareReferralLink}
                        disabled={!referralLink}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-50 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShareIcon />
                        {typeof navigator !== "undefined" && typeof navigator.share === "function" ? "Share" : "Copy Share Message"}
                      </button>
                      {shareOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handleOpenShareLink(option.key)}
                          disabled={!referralLink}
                          aria-label={option.title}
                          title={option.title}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${option.buttonClassName}`}
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/12">
                            {option.icon}
                          </span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                    {shouldUseWhatsAppCopyFallback() ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/75">
                        Wallet and mobile browsers usually block direct WhatsApp handoff. This button copies a ready-to-send message for manual paste.
                      </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-white/5 px-3 py-3 text-center">
                        <div className="text-xs uppercase tracking-[0.16em] text-white/55">Registered</div>
                        <div className="mt-2 text-xl font-black text-white">{referralStats?.stats?.totalRegistered ?? 0}</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-3 text-center">
                        <div className="text-xs uppercase tracking-[0.16em] text-white/55">Qualified</div>
                        <div className="mt-2 text-xl font-black text-emerald-200">{referralStats?.stats?.qualified ?? 0}</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-3 text-center">
                        <div className="text-xs uppercase tracking-[0.16em] text-white/55">Paid</div>
                        <div className="mt-2 text-xl font-black text-cyan-200">{referralStats?.stats?.referrerRewardsPaid ?? 0}</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-3 text-center">
                        <div className="text-xs uppercase tracking-[0.16em] text-white/55">Blocked</div>
                        <div className="mt-2 text-xl font-black text-rose-200">{referralStats?.stats?.blocked ?? 0}</div>
                      </div>
                    </div>
                    {referralStats?.referredBy ? (
                      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                        Referred by {referralStats.referredBy.referrerWallet}. Status: {referralStats.referredBy.status}. Your reward status: {referralStats.referredBy.referredRewardStatus}.
                      </div>
                    ) : null}
                    {referralStatus ? (
                      <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85">
                        {referralStatus}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85">
                        Share this link with a new wallet. If that wallet completes its first successful daily claim from a different IP, both wallets qualify for 1,000,000 EPWX.
                      </div>
                    )}
                  </div>
                </div>
                {!checkingVerification && !isTelegramVerified ? (
                  <a
                    href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ui-btn-primary inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm"
                  >
                    Verify Telegram Membership
                  </a>
                ) : null}
              </div>
            )}
            </div>
          </div>
        </section>

        <section id="buy-epwx" className="py-8 scroll-mt-24">
          <HomeSwapCard />
        </section>

        <section id="burnt-supply" className="scroll-mt-24">
          <TokenSupplyPieChart />
        </section>

        <LatestDailyWinnersBoard referralLink={referralLink} />

        {/* Cashback Rewards Section */}
        <section id="cashback-rewards" className="py-12 scroll-mt-24">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black mb-4 text-slate-100 text-center">Cashback Rewards</h2>
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
        <section id="daily-claim" className="py-12 scroll-mt-24">
          <div className={`${themedSectionClass} w-full max-w-lg mx-auto`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className={themedInnerClass}>
            <h2 className="text-2xl font-black mb-4 text-white">Daily Claim</h2>
            <div className="grid w-full grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
              <div className={`${glassPanelClass} p-4 text-center`}>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">Daily Claims Till Now</div>
                <div className="mt-2 text-3xl font-black text-white">
                  {dailyClaimsSummaryLoading ? '...' : (dailyClaimsSummary?.totalClaimsTillNow ?? 0).toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-white/75">Total daily claims submitted</div>
              </div>
              <div className={`${glassPanelClass} p-4 text-center`}>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">EPWX Distributed Till Now</div>
                <div className="mt-2 text-3xl font-black text-emerald-200">
                  {dailyClaimsSummaryLoading ? '...' : (dailyClaimsSummary?.totalEpwxDistributedTillNow ?? 0).toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-white/75">Total paid daily-claim rewards (EPWX)</div>
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
                    {buyerBadge && (
                      <div className="border-t border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
                        <div className="flex flex-wrap items-center gap-3">
                          <BuyerBadgeChip badge={buyerBadge} compact />
                          <span><span className="font-bold text-white">Active.</span> {buyerBadge.benefit}</span>
                        </div>
                      </div>
                    )}
                    {address && !balanceLoading && (
                      <div className="border-t border-white/15 bg-white/5 px-4 py-4 text-sm text-white/85">
                        {nextTierTarget ? (
                          <>
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Next unlock</div>
                            <div className="mt-2 text-base font-semibold text-white">
                              Buy or hold {formatEpwxBalance(tokensToNextTier)} more EPWX to unlock {nextTierReward?.toLocaleString()} EPWX per daily claim.
                            </div>
                            <div className="mt-2 text-white/70">
                              Target balance: {nextTierTarget.toLocaleString()} EPWX. Bigger balances make the daily claim materially more valuable.
                            </div>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                              <a
                                href="#buy-epwx"
                                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                              >
                                Buy EPWX To Reach Next Tier
                              </a>
                              <a
                                href="#cashback-rewards"
                                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
                              >
                                Check Buyer Cashback
                              </a>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Top tier active</div>
                            <div className="mt-2 text-base font-semibold text-emerald-100">
                              You are already on the highest daily reward tier at {MEGA_DAILY_REWARD.toLocaleString()} EPWX per claim.
                            </div>
                            <div className="mt-2 text-white/70">
                              Keep compounding with cashback, referrals, and social campaigns to strengthen your position.
                            </div>
                          </>
                        )}
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
                  <div className="mb-4 text-center text-sm text-white/80">
                    Track EPWX on the
                    <a href="https://coinmarketcap.com/currencies/epowerx-on-base/" target="_blank" rel="noopener noreferrer" className="ml-1 text-emerald-200 underline hover:text-white">CoinMarketCap watchlist</a>
                    if you want price and community updates.
                  </div>
                  <button
                    onClick={handleDailyClaim}
                    disabled={claiming || !agreed || !!remainingClaimTime}
                    className={`px-6 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 transition-colors mb-4 ${claiming || !agreed || !!remainingClaimTime ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  <div className="mb-4 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/80">
                    Daily claims use a wallet signature to confirm that you control this address. Signing this message does not transfer funds and does not create a token approval.
                  </div>
                  {showClaimUpgradePrompt && nextTierTarget && nextTierReward && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                      <div className="relative w-full max-w-lg rounded-2xl border border-emerald-200/20 bg-slate-950/95 p-6 text-white shadow-2xl">
                        <button
                          type="button"
                          className="absolute right-3 top-2 text-2xl font-bold text-white/60 hover:text-white"
                          onClick={() => setShowClaimUpgradePrompt(false)}
                          aria-label="Close"
                        >
                          &times;
                        </button>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Next tier unlocked by buying</div>
                        <h3 className="mt-3 text-2xl font-black text-white">Turn today&apos;s claim into a bigger claim tomorrow</h3>
                        <p className="mt-3 text-sm leading-7 text-white/80">
                          You claimed your daily reward. Buy or hold {formatEpwxBalance(tokensToNextTier)} more EPWX to move this wallet to the next tier and unlock {nextTierReward.toLocaleString()} EPWX per daily claim.
                        </p>
                        <p className="mt-2 text-sm leading-7 text-emerald-100/90">
                          Target balance: {nextTierTarget.toLocaleString()} EPWX.
                        </p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <a
                            href="#buy-epwx"
                            onClick={() => setShowClaimUpgradePrompt(false)}
                            className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                          >
                            Buy EPWX Now
                          </a>
                          <a
                            href="#cashback-rewards"
                            onClick={() => setShowClaimUpgradePrompt(false)}
                            className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
                          >
                            View Cashback Rewards
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-red-200 font-semibold mb-2">Please verify your Telegram membership to claim daily rewards.</div>
              )
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-center text-white/80 font-semibold mb-2">Connect your wallet to claim daily rewards.</div>
                <div className="max-w-sm rounded-2xl border border-white/15 bg-white/10 p-4 text-center text-sm text-white/80">
                  Connecting identifies the wallet that will receive rewards. It does not move funds or grant token permissions.
                </div>
              </div>
            )}
            </div>
          </div>
        </section>

        {/* User Daily Claims Table Section */}
        {address && (
          <section className="py-12">
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-black mb-4 text-slate-100 text-center">Your Daily Pending Claims</h2>
              <div className={`${themedSectionClass} w-full max-w-xl`}>
                <UserDailyClaims address={address} />
              </div>
            </div>
          </section>
        )}

        {/* Last 5 Paid Daily Claims Section */}
        <section className="py-12">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black mb-4 text-slate-100 text-center">Last 5 Paid Daily Claims (All Wallets)</h2>
            <div className={`${themedSectionClass} w-full max-w-xl`}>
              <LastFivePaidDailyClaims />
            </div>
          </div>
        </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/70 py-12 text-slate-200 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2 text-cyan-200">EPWX Task Platform</h3>
            <p className="text-slate-400">Earn tokens by completing campaigns on Base Network</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-6">
            <a href="https://epowex.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-300">Main Site</a>
            <span className="hidden md:block text-slate-600">•</span>
            <a href="/terms" className="transition-colors hover:text-cyan-300">Terms of Service</a>
            <span className="hidden md:block text-slate-600">•</span>
            <a href="/privacy" className="transition-colors hover:text-cyan-300">Privacy Policy</a>
            <span className="hidden md:block text-slate-600">•</span>
            <a href="/user-guide" className="transition-colors hover:text-cyan-300">User Guide</a>
            <span className="hidden md:block text-slate-600">•</span>
            <a href="https://twitter.com/epowex" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-300">Twitter</a>
          </div>
          <div className="text-center text-sm text-slate-400">
            <p>&copy; 2025 EPWX Task Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <div className="fixed inset-x-3 bottom-3 z-40 flex gap-2 overflow-x-auto rounded-2xl border border-white/15 bg-slate-950/88 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.35)] backdrop-blur-md [scrollbar-width:none] lg:hidden">
        {shortcutActionItems.map((item) => (
          <a
            key={item.section}
            href={item.href}
            onClick={() => setActiveShortcutSection(item.section)}
            className={`flex min-w-[112px] items-center justify-center rounded-xl px-3 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.14em] text-white transition-colors ${activeShortcutSection === item.section ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-white/8 hover:bg-white/14'}`}
          >
            {item.label === 'Burnt Supply' ? '90% Burnt' : item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
