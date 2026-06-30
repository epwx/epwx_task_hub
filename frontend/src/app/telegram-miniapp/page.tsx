"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useSignMessage } from "wagmi";

type TelegramMiniAppUser = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  languageCode: string | null;
};

type TelegramMiniAppAuthResponse = {
  success: boolean;
  telegramUser: TelegramMiniAppUser;
  linkedWallet: string | null;
  telegramVerified: boolean;
  officialGroupMember?: boolean;
  officialGroupReason?: string;
  error?: string;
};

type TelegramMiniAppNonceResponse = {
  success: boolean;
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: number;
  error?: string;
};

type TelegramMiniAppConnectResponse = {
  success: boolean;
  data?: {
    user?: {
      id: string;
      walletAddress: string;
      telegramUserId: string;
      telegramUsername: string | null;
      telegramVerified: boolean;
    };
    token?: string;
  };
  error?: string;
};

type DailyClaimResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  amount?: string;
  status?: string;
  txHash?: string | null;
};

type DailyClaimListResponse = {
  claims?: Array<{ claimedAt: string }>;
};

type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const BASE_DAILY_REWARD = 100000;

function normalizeWallet(wallet: string | undefined): string {
  return (wallet || "").trim().toLowerCase();
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function shortenAddress(value: string): string {
  if (!value || value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function resolveInitDataFromLocation(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const fromSearch = new URLSearchParams(window.location.search).get("tgWebAppData");
  if (fromSearch) {
    return fromSearch;
  }

  const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (hash) {
    const fromHash = new URLSearchParams(hash).get("tgWebAppData");
    if (fromHash) {
      return fromHash;
    }
  }

  return "";
}

function resolveGroupContextTokenFromLocation(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const fromSearch = new URLSearchParams(window.location.search).get("groupCtx");
  if (fromSearch) {
    return fromSearch;
  }

  const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (hash) {
    const fromHash = new URLSearchParams(hash).get("groupCtx");
    if (fromHash) {
      return fromHash;
    }
  }

  return "";
}

function resolveQueryValueFromLocation(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  const fromSearch = new URLSearchParams(window.location.search).get(key);
  if (fromSearch) {
    return fromSearch;
  }

  const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (hash) {
    const fromHash = new URLSearchParams(hash).get(key);
    if (fromHash) {
      return fromHash;
    }
  }

  return "";
}

export default function TelegramMiniAppPage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [initData, setInitData] = useState<string>("");
  const [telegramUser, setTelegramUser] = useState<TelegramMiniAppUser | null>(null);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [nextClaimAt, setNextClaimAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<string>("");
  const [groupContextToken, setGroupContextToken] = useState<string>("");
  const [registerGroupId, setRegisterGroupId] = useState<string>("");
  const [sourceGroupId, setSourceGroupId] = useState<string>("");

  const normalizedConnectedWallet = useMemo(() => normalizeWallet(address), [address]);
  const normalizedLinkedWallet = useMemo(() => normalizeWallet(linkedWallet || undefined), [linkedWallet]);
  const canClaim = Boolean(
    initData &&
      normalizedConnectedWallet &&
      normalizedLinkedWallet &&
      normalizedConnectedWallet === normalizedLinkedWallet
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const webApp = window.Telegram?.WebApp;
    webApp?.ready?.();
    webApp?.expand?.();
    const resolved = webApp?.initData || resolveInitDataFromLocation();
    setInitData(resolved);
    setGroupContextToken(resolveGroupContextTokenFromLocation());
    setRegisterGroupId(resolveQueryValueFromLocation("registerGroupId"));
    setSourceGroupId(resolveQueryValueFromLocation("sourceGroupId"));
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!initData) {
        setStatus("Open this page from Telegram Mini App to continue.");
        setLoadingAuth(false);
        return;
      }

      setLoadingAuth(true);
      try {
        const res = await fetch("/api/telegram-miniapp/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        const data = (await res.json()) as TelegramMiniAppAuthResponse;
        if (!res.ok || !data.success) {
          setStatus(data.error || "Telegram authentication failed.");
          setTelegramUser(null);
          setLinkedWallet(null);
          setLoadingAuth(false);
          return;
        }

        setTelegramUser(data.telegramUser);
        setLinkedWallet(data.linkedWallet || null);
        if (data.officialGroupMember === false) {
          setStatus("Join the official EPWX Telegram group first, then reopen this Mini App.");
        } else {
          setStatus(data.linkedWallet ? "Telegram account verified. Wallet is linked." : "Telegram account verified. Connect and link a wallet.");
        }
      } catch {
        setStatus("Unable to verify Telegram session right now.");
      } finally {
        setLoadingAuth(false);
      }
    };

    void checkAuth();
  }, [initData]);

  useEffect(() => {
    const loadGroupContextToken = async () => {
      if (!initData || !sourceGroupId) {
        return;
      }

      try {
        const res = await fetch("/api/telegram-miniapp/group-owner/context-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData,
            groupId: sourceGroupId,
          }),
        });

        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          groupContextToken?: string;
        };

        if (!res.ok || !data.success || !data.groupContextToken) {
          setStatus((current) => current || data.error || "Unable to resolve group campaign context.");
          return;
        }

        setGroupContextToken(data.groupContextToken);
      } catch {
        setStatus((current) => current || "Unable to resolve group campaign context.");
      }
    };

    void loadGroupContextToken();
  }, [initData, sourceGroupId]);

  useEffect(() => {
    if (!normalizedLinkedWallet) {
      setNextClaimAt(null);
      return;
    }

    const loadLastClaim = async () => {
      try {
        const res = await fetch(`/api/epwx/daily-claims?wallet=${normalizedLinkedWallet}&limit=1`, { cache: "no-store" });
        if (!res.ok) {
          setNextClaimAt(null);
          return;
        }
        const data = (await res.json()) as DailyClaimListResponse;
        const latestClaimedAt = data.claims?.[0]?.claimedAt;
        if (!latestClaimedAt) {
          setNextClaimAt(null);
          return;
        }

        const next = new Date(latestClaimedAt).getTime() + 24 * 60 * 60 * 1000;
        setNextClaimAt(next > Date.now() ? next : null);
      } catch {
        setNextClaimAt(null);
      }
    };

    void loadLastClaim();
  }, [normalizedLinkedWallet, status]);

  useEffect(() => {
    if (!nextClaimAt) {
      setRemaining("");
      return;
    }

    const tick = () => {
      const msLeft = nextClaimAt - Date.now();
      if (msLeft <= 0) {
        setRemaining("");
        setNextClaimAt(null);
        return;
      }
      setRemaining(formatRemaining(msLeft));
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [nextClaimAt]);

  const handleLinkWallet = async () => {
    if (!initData) {
      setStatus("Telegram session missing. Reopen the Mini App.");
      return;
    }
    if (!normalizedConnectedWallet) {
      setStatus("Connect your wallet first.");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const nonceRes = await fetch("/api/telegram-miniapp/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          walletAddress: normalizedConnectedWallet,
        }),
      });

      const nonceData = (await nonceRes.json()) as TelegramMiniAppNonceResponse;
      if (!nonceRes.ok || !nonceData.success) {
        setStatus(nonceData.error || "Failed to create wallet challenge.");
        setBusy(false);
        return;
      }

      const signature = await signMessageAsync({ message: nonceData.message });

      const connectRes = await fetch("/api/telegram-miniapp/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          walletAddress: normalizedConnectedWallet,
          signature,
        }),
      });

      const connectData = (await connectRes.json()) as TelegramMiniAppConnectResponse;
      if (!connectRes.ok || !connectData.success) {
        setStatus(connectData.error || "Wallet link failed.");
        setBusy(false);
        return;
      }

      const connectedWallet = normalizeWallet(connectData.data?.user?.walletAddress);
      if (connectedWallet) {
        setLinkedWallet(connectedWallet);
      }

      setStatus("Wallet linked successfully. You can request your daily claim now.");
    } catch {
      setStatus("Wallet link failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDailyClaim = async () => {
    if (!normalizedConnectedWallet) {
      setStatus("Connect your wallet first.");
      return;
    }
    if (!canClaim) {
      setStatus("Linked wallet and connected wallet must match before claiming.");
      return;
    }
    if (nextClaimAt && nextClaimAt > Date.now()) {
      setStatus(`You can claim again in ${remaining || "a while"}.`);
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const todayUtc = new Date().toISOString().slice(0, 10);
      const message = `EPWX Daily Claim for ${normalizedConnectedWallet} on ${todayUtc}`;
      const signature = await signMessageAsync({ message });

      const res = await fetch("/api/epwx/daily-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: normalizedConnectedWallet,
          signature,
          ...(groupContextToken ? { groupContextToken } : {}),
        }),
      });

      const data = (await res.json()) as DailyClaimResponse;
      if (!res.ok || !data.success) {
        setStatus(data.error || "Daily claim failed.");
        setBusy(false);
        return;
      }

      const amount = Number(data.amount || BASE_DAILY_REWARD).toLocaleString();
      setStatus(`Claim submitted: ${amount} EPWX. ${data.message || ""}`.trim());
      setNextClaimAt(Date.now() + 24 * 60 * 60 * 1000);
    } catch {
      setStatus("Daily claim failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterGroup = async () => {
    if (!initData) {
      setStatus("Telegram session missing. Reopen the Mini App.");
      return;
    }
    if (!registerGroupId) {
      setStatus("Group registration context is missing.");
      return;
    }
    if (!normalizedConnectedWallet || !canClaim) {
      setStatus("Connect and link the same wallet before group registration.");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const res = await fetch("/api/telegram-miniapp/group-owner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          walletAddress: normalizedConnectedWallet,
          groupId: registerGroupId,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        miniAppLink?: string;
        groupContextToken?: string;
      };

      if (!res.ok || !data.success) {
        setStatus(data.error || "Failed to register this group.");
        return;
      }

      if (data.groupContextToken) {
        setGroupContextToken(data.groupContextToken);
      }

      if (data.miniAppLink) {
        try {
          await navigator.clipboard.writeText(data.miniAppLink);
          setStatus("Group registered. Campaign Mini App link copied to clipboard.");
        } catch {
          setStatus(`Group registered. Share this link in your group: ${data.miniAppLink}`);
        }
      } else {
        setStatus("Group registered successfully.");
      }
    } catch {
      setStatus("Failed to register this group.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-lg rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-900/50 via-slate-900 to-blue-950 p-6 shadow-2xl">
        <h1 className="text-center text-3xl font-black tracking-tight">Telegram Daily Claim</h1>
        <p className="mt-2 text-center text-sm text-slate-300">
          Verify Telegram session, link wallet once, then submit your daily EPWX claim.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Telegram</span>
            <span className="font-semibold text-emerald-300">
              {loadingAuth ? "Checking..." : telegramUser ? "Verified" : "Not verified"}
            </span>
          </div>
          <div className="grid grid-cols-[auto,1fr] items-center gap-3">
            <span className="text-slate-300">Telegram user</span>
            <span
              className="truncate text-right font-mono text-xs text-slate-200"
              title={telegramUser?.username || telegramUser?.id || "-"}
            >
              {telegramUser?.username || telegramUser?.id || "-"}
            </span>
          </div>
          <div className="grid grid-cols-[auto,1fr] items-center gap-3">
            <span className="text-slate-300">Linked wallet</span>
            <span
              className="truncate text-right font-mono text-xs text-slate-200"
              title={normalizedLinkedWallet || "-"}
            >
              {normalizedLinkedWallet ? shortenAddress(normalizedLinkedWallet) : "-"}
            </span>
          </div>
          <div className="grid grid-cols-[auto,1fr] items-center gap-3">
            <span className="text-slate-300">Connected wallet</span>
            <span
              className="truncate text-right font-mono text-xs text-slate-200"
              title={normalizedConnectedWallet || "-"}
            >
              {normalizedConnectedWallet ? shortenAddress(normalizedConnectedWallet) : "-"}
            </span>
          </div>
          {remaining ? (
            <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-center text-amber-100">
              Next claim in {remaining}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-center">
          <ConnectKitButton />
        </div>

        <div className="mt-4 grid gap-3">
          {registerGroupId ? (
            <button
              type="button"
              disabled={busy || !telegramUser || !canClaim}
              onClick={handleRegisterGroup}
              className="rounded-xl border border-fuchsia-200/40 bg-fuchsia-300/15 px-4 py-3 font-semibold text-fuchsia-50 transition hover:bg-fuchsia-300/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Processing..." : "Register This Group For Owner Rewards"}
            </button>
          ) : null}

          <button
            type="button"
            disabled={busy || !telegramUser || !normalizedConnectedWallet}
            onClick={handleLinkWallet}
            className="rounded-xl border border-cyan-200/40 bg-cyan-300/15 px-4 py-3 font-semibold text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Processing..." : "Link Wallet"}
          </button>

          <button
            type="button"
            disabled={busy || !canClaim || Boolean(nextClaimAt && nextClaimAt > Date.now())}
            onClick={handleDailyClaim}
            className="rounded-xl border border-emerald-200/40 bg-emerald-300/15 px-4 py-3 font-semibold text-emerald-50 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Submitting..." : "Request Daily Claim"}
          </button>
        </div>

        {status ? (
          <div className="mt-4 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-slate-100">
            {status}
          </div>
        ) : null}
      </section>
    </main>
  );
}
