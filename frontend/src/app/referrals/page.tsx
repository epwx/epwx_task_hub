"use client";

import { useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { ShareIcon, TelegramIcon, WhatsAppIcon, XIcon } from "@/components/icons/SocialIcons";
import { PENDING_REFERRAL_STORAGE_KEY } from "@/app/homeConstants";

interface ReferralStatsResponse {
  stats?: {
    totalRegistered?: number;
    pending?: number;
    qualified?: number;
    blocked?: number;
    referrerRewardsPaid?: number;
  };
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

function shouldUseWhatsAppCopyFallback() {
  return isWalletInAppBrowser() || isMobileBrowser();
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

export default function ReferralsPage() {
  const { address, isConnected } = useAccount();
  const [incomingReferralWallet, setIncomingReferralWallet] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStatsResponse | null>(null);
  const [referralStatus, setReferralStatus] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const referralWallet = new URLSearchParams(window.location.search).get("ref");
    setIncomingReferralWallet(referralWallet ? referralWallet.toLowerCase() : null);
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
        setReferralStatus("Unable to open the share dialog right now.");
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

  return (
    <div className="relative overflow-hidden bg-slate-950 px-4 py-8 text-white sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-32 top-24 h-80 w-80 rounded-full bg-blue-600/12 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <section className="ui-surface-strong relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Wallet Referrals</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Referral Rewards</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                Share your referral link, track qualified wallets, and help both wallets qualify after the referred wallet completes a first daily claim.
              </p>
            </div>
            <div className="ui-surface self-start px-4 py-3 text-sm text-slate-200">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reward amount</div>
              <div className="mt-1 font-semibold text-white">1,000,000 EPWX</div>
              <div className="mt-1 text-slate-300">Paid per qualified wallet when referral rules are met.</div>
            </div>
          </div>
        </section>

        <section className="ui-surface-strong p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Connection</p>
              <h2 className="mt-1 text-xl font-bold text-white">Referral Wallet</h2>
              <p className="mt-1 text-sm text-slate-300">
                {isConnected ? "Your referral link and stats are tied to the connected wallet." : "Connect your wallet to generate your referral link."}
              </p>
            </div>
            <ConnectKitButton />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
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

          <div className="mt-5 rounded-2xl border border-white/15 bg-slate-950/20 px-3 py-3 text-xs text-white/85 break-all">
            {referralLink || "Referral link will appear after wallet connection."}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyReferralLink}
              disabled={!referralLink}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy Link"}
            </button>
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
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/75">
              Wallet and mobile browsers usually block direct WhatsApp handoff. This button copies a ready-to-send message for manual paste.
            </div>
          ) : null}

          {referralStats?.referredBy ? (
            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
              <div>Referred by</div>
              <div className="break-all font-semibold">{referralStats.referredBy.referrerWallet}</div>
              <div className="mt-1">Status: {referralStats.referredBy.status}</div>
              <div>Your reward status: {referralStats.referredBy.referredRewardStatus}</div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85">
            {referralStatus || "Share this link with a new wallet. If that wallet completes its first successful daily claim from a different IP, both wallets qualify for 1,000,000 EPWX."}
          </div>
        </section>
      </main>
    </div>
  );
}