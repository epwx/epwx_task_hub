"use client";
import Link from "next/link";
import { EPWXCashbackClaim } from "@/components/EPWXCashbackClaim_clean";
import { HomeSwapCard } from "@/components/HomeSwapCard";
import { TokenSupplyPieChart } from "@/components/TokenSupplyPieChart";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";
import { Fragment, useCallback, useState, useEffect } from "react";
import { useAccount, useBalance, useSignMessage } from "wagmi";
import { base } from "wagmi/chains";
import toast from "react-hot-toast";
import { ConnectKitButton } from "connectkit";
import TermsAndConditionsModal from "@/components/TermsAndConditionsModal";
import UserDailyClaims from "@/components/UserDailyClaims";
import LastFivePaidDailyClaims from "@/components/LastFivePaidDailyClaims";
import LatestDailyWinnersBoard from "@/components/LatestDailyWinnersBoard";
import { BuyerBadgeChip, type BuyerBadge } from "@/components/BuyerBadge";
import { ShareIcon, XIcon, TelegramIcon, WhatsAppIcon } from "@/components/icons/SocialIcons";
import { formatEpwxBalance, formatDuration } from "@/utils/homeFormat";
import {
  themedSectionClass,
  themedInnerClass,
  glassPanelClass,
  EPWX_TOKEN_ADDRESS,
  DEFAULT_DAILY_REWARD,
  MID_TIER_DAILY_REWARD,
  BONUS_DAILY_REWARD,
  MEGA_DAILY_REWARD,
  MID_TIER_DAILY_REWARD_THRESHOLD,
  BONUS_DAILY_REWARD_THRESHOLD,
  MEGA_DAILY_REWARD_THRESHOLD,
  TELEGRAM_VERIFICATION_RECHECK_INTERVAL_MS,
  TELEGRAM_BOT_USERNAME,
  PENDING_REFERRAL_STORAGE_KEY,
  PENDING_PARTNER_REFERRAL_CODE_STORAGE_KEY,
  HOME_SHORTCUT_SECTIONS,
  DAILY_REWARD_TIERS,
} from "./homeConstants";
import type { HomeShortcutSection } from "./homeConstants";

interface DailyClaimsSummary {
  todayUtc: string;
  totalClaimsToday: number;
  totalPaidToday: number;
  totalClaimsTillNow: number;
  totalEpwxDistributedTillNow: number;
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
  const [walletCopied, setWalletCopied] = useState(false);

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
  const [telegramVerificationLastCheckedAt, setTelegramVerificationLastCheckedAt] = useState<number | null>(null);
  const [telegramVerificationError, setTelegramVerificationError] = useState<string | null>(null);
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

  const checkVerification = useCallback(async () => {
    const API_URL = getApiBaseUrl();
    if (!address) {
      setIsTelegramVerified(false);
      setTelegramVerificationLastCheckedAt(null);
      setTelegramVerificationError(null);
      return;
    }

    setCheckingVerification(true);
    setTelegramVerificationError(null);
    try {
      const res = await fetch(`${API_URL}/api/epwx/telegram-verified?wallet=${address}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Verification check failed');
      }
      const data = await res.json();
      setIsTelegramVerified(!!data.verified);
      setTelegramVerificationLastCheckedAt(Date.now());
    } catch {
      setIsTelegramVerified((currentValue) => currentValue);
      setTelegramVerificationError('Unable to refresh Telegram status right now. Try again.');
    }
    setCheckingVerification(false);
  }, [address]);

  useEffect(() => {

    checkVerification();

    const handleFocus = () => {
      void checkVerification();
    };

    const handlePageShow = () => {
      void checkVerification();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    if (!address) {
      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('pageshow', handlePageShow);
      };
    }

    const intervalId = isTelegramVerified
      ? null
      : window.setInterval(checkVerification, TELEGRAM_VERIFICATION_RECHECK_INTERVAL_MS);

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [address, checkVerification, isTelegramVerified]);

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

  const quickRailItems: Array<{ label: string; href: string }> = [
    { label: "Wallet", href: "#wallet-verification" },
    { label: "Burnt Supply", href: "#burnt-supply" },
    { label: "Cashback Rewards", href: "#cashback-rewards" },
  ];

  const shortcutActionItems: Array<{ section: HomeShortcutSection; label: string; href: string; eyebrow: string }> = [
    { section: 'latest-winners', label: 'Next Draw', href: '#latest-winners', eyebrow: 'Rewards' },
    { section: 'buy-epwx', label: 'Buy EPWX', href: '#buy-epwx', eyebrow: 'Swap' },
    { section: 'daily-claim', label: 'Daily Claim', href: '#daily-claim', eyebrow: 'Claim' },
  ];

  const mobileShortcutActionItems: Array<{ section: HomeShortcutSection; label: string; href: string; eyebrow: string }> = [
    { section: 'latest-winners', label: 'Next Draw', href: '#latest-winners', eyebrow: 'Rewards' },
    { section: 'buy-epwx', label: 'Buy EPWX', href: '#buy-epwx', eyebrow: 'Swap' },
    { section: 'daily-claim', label: 'Daily Claim', href: '#daily-claim', eyebrow: 'Claim' },
    { section: 'burnt-supply', label: 'Burnt Supply', href: '#burnt-supply', eyebrow: 'Tokenomics' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-950 text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute -right-28 top-12 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[150px]" />
      </div>

      <section className="sticky top-[76px] z-20 hidden border-b border-white/10 bg-slate-950/70 backdrop-blur-xl lg:block">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-2.5">
          <div className="min-w-0 pr-3">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Quick Actions</div>
          </div>
          <div className="ml-auto grid flex-1 grid-cols-3 gap-2">
            {shortcutActionItems.map((item) => (
              <a
                key={item.section}
                href={item.href}
                onClick={() => setActiveShortcutSection(item.section)}
                className={`rounded-2xl border px-3 py-2.5 text-left transition-colors ${activeShortcutSection === item.section ? 'border-emerald-300/40 bg-emerald-400/18 text-emerald-50' : 'border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]'}`}
              >
                <div className={`text-[10px] font-black uppercase tracking-[0.22em] ${activeShortcutSection === item.section ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                  {item.eyebrow}
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.08em] xl:text-sm">{item.label}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 pb-28 pt-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:pb-12 lg:pt-10">
        <aside className="hidden lg:block">
          <div className="ui-surface-strong sticky top-[11rem] p-4 shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
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
        <section id="wallet-verification" className="my-8 scroll-mt-36">
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
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-200" title={address}>
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(address);
                          setWalletCopied(true);
                          window.setTimeout(() => setWalletCopied(false), 2000);
                        }}
                        className="shrink-0 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.12]"
                        aria-label="Copy wallet address"
                      >
                        {walletCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
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
                      <div className="mt-2 space-y-3">
                        <div className="ui-status ui-status-danger">Not verified</div>
                        <a
                          href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ui-btn-primary inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm"
                        >
                          Verify Telegram Membership
                        </a>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                      <span>
                        {telegramVerificationLastCheckedAt
                          ? `Last checked: ${new Date(telegramVerificationLastCheckedAt).toLocaleTimeString()}`
                          : 'Last checked: not yet'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void checkVerification();
                        }}
                        className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 font-semibold text-slate-100 transition-colors hover:bg-white/20"
                      >
                        Refresh Status
                      </button>
                    </div>
                    {telegramVerificationError ? (
                      <div className="mt-2 text-xs text-amber-200">{telegramVerificationError}</div>
                    ) : null}
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
                        <div>Referred by</div>
                        <div className="break-all font-semibold">{referralStats.referredBy.referrerWallet}</div>
                        <div className="mt-1">Status: {referralStats.referredBy.status}</div>
                        <div>Your reward status: {referralStats.referredBy.referredRewardStatus}</div>
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

        <section id="buy-epwx" className="py-8 scroll-mt-36">
          <HomeSwapCard />
        </section>

        <section id="burnt-supply" className="scroll-mt-36">
          <TokenSupplyPieChart />
        </section>

        <LatestDailyWinnersBoard referralLink={referralLink} />

        {/* Cashback Rewards Section */}
        <section id="cashback-rewards" className="py-12 scroll-mt-36">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black mb-4 text-slate-100 text-center">Cashback Rewards</h2>
            <div className="w-full max-w-4xl">
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
              <TermsAndConditionsModal open={showSpecialTerms} onClose={() => setShowSpecialTerms(false)} />
              {specialClaimStatus && (
                <div className="text-center text-lg font-semibold text-white mb-2">{specialClaimStatus}</div>
              )}
              </div>
            </div>
          </section>
        )}

        {/* Daily Claim Section */}
        <section id="daily-claim" className="py-12 scroll-mt-36">
          <div className={`${themedSectionClass} w-full max-w-4xl mx-auto`}>
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
                    className={`block mx-auto px-6 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 transition-colors mb-4 ${claiming || !agreed || !!remainingClaimTime ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  <TermsAndConditionsModal open={showTerms} onClose={() => setShowTerms(false)} />
                  {claimStatus && (
                    <div className="text-center text-lg font-semibold text-white mb-2">{claimStatus}</div>
                  )}
                  {!isTelegramVerified ? (
                    <div className="mb-4 rounded-2xl border border-amber-300/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                      Telegram group is not verified for this wallet yet. Daily rewards are paid at 50% of the current tier until group verification is complete.
                    </div>
                  ) : null}
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
              <div className="flex flex-col items-center">
                <div className="text-center text-white/80 font-semibold mb-2">Connect your wallet to claim daily rewards.</div>
                <div className="mt-2">
                  <ConnectKitButton />
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
            <div className={`${themedSectionClass} w-full max-w-5xl`}>
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
        {mobileShortcutActionItems.map((item) => (
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
