"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useSignMessage } from "wagmi";
import { ethers } from "ethers";

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

type ErrorLike = {
  message?: string;
  shortMessage?: string;
};

function getErrorMessage(error: unknown): string {
  const err = (error || {}) as ErrorLike;
  return String(err.shortMessage || err.message || "").trim();
}

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
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
};

declare global {
  interface Window {
    ethereum?: any;
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const BASE_DAILY_REWARD = 100000;
const MINI_APP_FETCH_TIMEOUT_MS = 15000;
const WALLET_SIGNATURE_TIMEOUT_MS = 45000;
const TELEGRAM_BOT_ADD_GROUP_URL = "https://t.me/epwx_bot?startgroup=true";

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), MINI_APP_FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const text = await response.text();
    if (!text) {
      return `${fallback} (HTTP ${response.status})`;
    }

    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      const detailed = parsed.error || parsed.message;
      if (detailed) {
        return detailed;
      }
    } catch {
      // Non-JSON responses can happen behind proxies/load balancers.
    }

    return `${fallback} (HTTP ${response.status})`;
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }
}

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

function buildMetaMaskDeepLink(url: string): string {
  return `https://link.metamask.io/dapp/${encodeURIComponent(url)}`;
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

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function CollapsibleSection({ title, description, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          {description ? <p className="mt-1 text-xs text-slate-300">{description}</p> : null}
        </div>
        <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-200">
          {isOpen ? "Collapse" : "Expand"}
        </span>
      </button>

      {isOpen ? <div className="mt-4 space-y-4">{children}</div> : null}
    </section>
  );
}

export default function TelegramMiniAppPage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  type ActiveAction = "link" | "claim" | "register";

  const [initData, setInitData] = useState<string>("");
  const [telegramUser, setTelegramUser] = useState<TelegramMiniAppUser | null>(null);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);
  const [awaitingWalletSignature, setAwaitingWalletSignature] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [nextClaimAt, setNextClaimAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<string>("");
  const [groupContextToken, setGroupContextToken] = useState<string>("");
  const [registerGroupId, setRegisterGroupId] = useState<string>("");
  const [sourceGroupId, setSourceGroupId] = useState<string>("");
  const [groupRegistrationComplete, setGroupRegistrationComplete] = useState(false);
  const [isTelegramWebView, setIsTelegramWebView] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string>("");
  const [openSections, setOpenSections] = useState<{ dailyClaim: boolean }>({ dailyClaim: true });

  const toggleSection = (section: "dailyClaim") => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const normalizedConnectedWallet = useMemo(() => normalizeWallet(address), [address]);
  const normalizedLinkedWallet = useMemo(() => normalizeWallet(linkedWallet || undefined), [linkedWallet]);
  const busy = activeAction !== null;
  const canClaim = Boolean(
    initData &&
      normalizedConnectedWallet &&
      normalizedLinkedWallet &&
      normalizedConnectedWallet === normalizedLinkedWallet
  );
  const claimOnCooldown = Boolean(nextClaimAt && nextClaimAt > Date.now());
  const claimDisabled = busy || !canClaim || claimOnCooldown;

  let claimDisabledReason = "";
  if (claimOnCooldown) {
    claimDisabledReason = `Next claim in ${remaining || "a while"}.`;
  } else if (busy) {
    claimDisabledReason = "Current action in progress. Complete wallet signature and wait for response.";
  } else if (!initData) {
    claimDisabledReason = "Open this page from Telegram Mini App to submit claims.";
  } else if (!normalizedConnectedWallet) {
    claimDisabledReason = "Connect your wallet first.";
  } else if (!normalizedLinkedWallet) {
    claimDisabledReason = "Link your wallet first.";
  } else if (normalizedConnectedWallet !== normalizedLinkedWallet) {
    claimDisabledReason = "Connected wallet must match linked wallet before claiming.";
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const webApp = window.Telegram?.WebApp;
    webApp?.ready?.();
    webApp?.expand?.();
    setIsTelegramWebView(Boolean(webApp));
    const resolved = webApp?.initData || resolveInitDataFromLocation();
    setInitData(resolved);
    setGroupContextToken(resolveGroupContextTokenFromLocation());
    setRegisterGroupId(resolveQueryValueFromLocation("registerGroupId"));
    setSourceGroupId(resolveQueryValueFromLocation("sourceGroupId"));
    setShareableUrl(window.location.href);
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
        const res = await fetchWithTimeout("/api/telegram-miniapp/auth", {
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
          setStatus(
            data.linkedWallet
              ? "Telegram account verified. Wallet is linked. To switch wallets, connect a different wallet and tap Update Linked Wallet."
              : "Telegram account verified. Connect and link a wallet."
          );
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
        const res = await fetchWithTimeout("/api/telegram-miniapp/group-owner/context-token", {
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
        const res = await fetchWithTimeout(`/api/epwx/daily-claims?wallet=${normalizedLinkedWallet}&limit=1`, { cache: "no-store" });
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

  const signMessageForMiniApp = async (message: string): Promise<string> => {
    try {
      return await withTimeout(
        signMessageAsync({ message }),
        WALLET_SIGNATURE_TIMEOUT_MS,
        "Wallet signature timed out. Reopen in wallet browser and try again."
      );
    } catch (error) {
      const rawMessage = getErrorMessage(error);
      const isChainSwitchIssue = /switch chain|switch network|unsupported chain|chain not configured/i.test(rawMessage);
      if (!isChainSwitchIssue || !window.ethereum) {
        throw error;
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      return withTimeout(
        signer.signMessage(message),
        WALLET_SIGNATURE_TIMEOUT_MS,
        "Wallet signature timed out. Reopen in wallet browser and try again."
      );
    }
  };

  const handleLinkWallet = async () => {
    if (!initData) {
      setStatus("Telegram session missing. Reopen the Mini App.");
      return;
    }
    if (!normalizedConnectedWallet) {
      setStatus("Connect your wallet first.");
      return;
    }

    if (normalizedLinkedWallet && normalizedLinkedWallet !== normalizedConnectedWallet) {
      const confirmed = window.confirm(
        `Linked wallet is currently ${shortenAddress(normalizedLinkedWallet)}. Do you want to replace it with ${shortenAddress(normalizedConnectedWallet)}?`
      );
      if (!confirmed) {
        setStatus("Wallet change cancelled.");
        return;
      }
    }

    setActiveAction("link");
    setAwaitingWalletSignature(false);
    setStatus("");

    try {
      const nonceRes = await fetchWithTimeout("/api/telegram-miniapp/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          walletAddress: normalizedConnectedWallet,
        }),
      });

      if (!nonceRes.ok) {
        setStatus(await readApiError(nonceRes, "Failed to create wallet challenge."));
        setActiveAction(null);
        return;
      }

      const nonceData = (await nonceRes.json()) as TelegramMiniAppNonceResponse;
      if (!nonceData.success) {
        setStatus(nonceData.error || "Failed to create wallet challenge.");
        setActiveAction(null);
        return;
      }

      setAwaitingWalletSignature(true);
      setStatus("Waiting for wallet signature. Open MetaMask/Coinbase Wallet, approve the signature, then return here.");
      const signature = await signMessageForMiniApp(nonceData.message);
      setAwaitingWalletSignature(false);

      const connectRes = await fetchWithTimeout("/api/telegram-miniapp/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          walletAddress: normalizedConnectedWallet,
          signature,
        }),
      });

      if (!connectRes.ok) {
        setStatus(await readApiError(connectRes, "Wallet link failed."));
        setActiveAction(null);
        return;
      }

      const connectData = (await connectRes.json()) as TelegramMiniAppConnectResponse;
      if (!connectData.success) {
        setStatus(connectData.error || "Wallet link failed.");
        setActiveAction(null);
        return;
      }

      const connectedWallet = normalizeWallet(connectData.data?.user?.walletAddress);
      if (connectedWallet) {
        setLinkedWallet(connectedWallet);
      }

      setStatus(
        normalizedLinkedWallet && normalizedLinkedWallet !== connectedWallet
          ? "Linked wallet updated successfully. You can request your daily claim now."
          : "Wallet linked successfully. You can request your daily claim now."
      );
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        setStatus("Wallet link timed out. Please try again.");
      } else {
        const rawMessage = getErrorMessage(error);
        if (/signature timed out/i.test(rawMessage)) {
          setStatus(rawMessage);
        } else 
        if (/rejected|denied|cancelled|canceled/i.test(rawMessage)) {
          setStatus("Wallet signature was cancelled in your wallet app.");
        } else if (rawMessage) {
          setStatus(`Wallet link failed: ${rawMessage}`);
        } else {
          setStatus("Wallet link failed. Please try again.");
        }
      }
    } finally {
      setAwaitingWalletSignature(false);
      setActiveAction(null);
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

    setActiveAction("claim");
    setAwaitingWalletSignature(false);
    setStatus("");

    try {
      const todayUtc = new Date().toISOString().slice(0, 10);
      const message = `EPWX Daily Claim for ${normalizedConnectedWallet} on ${todayUtc}`;
      setAwaitingWalletSignature(true);
      setStatus("Waiting for wallet signature. Open MetaMask/Coinbase Wallet, approve the signature, then return here.");
      const signature = await signMessageForMiniApp(message);
      setAwaitingWalletSignature(false);

      const res = await fetchWithTimeout("/api/epwx/daily-claim", {
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
        setActiveAction(null);
        return;
      }

      const amount = Number(data.amount || BASE_DAILY_REWARD).toLocaleString();
      setStatus(`Claim submitted: ${amount} EPWX. ${data.message || ""}`.trim());
      setNextClaimAt(Date.now() + 24 * 60 * 60 * 1000);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        setStatus("Daily claim timed out. Please try again.");
      } else {
        const rawMessage = getErrorMessage(error);
        if (/signature timed out/i.test(rawMessage)) {
          setStatus(rawMessage);
        } else {
          setStatus("Daily claim failed. Please try again.");
        }
      }
    } finally {
      setAwaitingWalletSignature(false);
      setActiveAction(null);
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

    setActiveAction("register");
    setStatus("");

    try {
      const res = await fetchWithTimeout("/api/telegram-miniapp/group-owner/register", {
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

      setGroupRegistrationComplete(true);
      setRegisterGroupId("");

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
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        setStatus("Group registration timed out. Please try again.");
      } else {
        setStatus("Failed to register this group.");
      }
    } finally {
      setActiveAction(null);
    }
  };

  const handleOpenInExternalBrowser = () => {
    if (!shareableUrl) {
      setStatus("Unable to determine the current Mini App link.");
      return;
    }

    try {
      const webApp = window.Telegram?.WebApp;
      if (webApp?.openLink) {
        webApp.openLink(shareableUrl, { try_instant_view: false });
        return;
      }

      window.open(shareableUrl, "_blank", "noopener,noreferrer");
    } catch {
      setStatus("Unable to open external browser automatically. Copy this page URL and open it in Coinbase Wallet or MetaMask browser.");
    }
  };

  const handleCopyMiniAppLink = async () => {
    if (!shareableUrl) {
      setStatus("Unable to determine the current Mini App link.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setStatus("Mini App link copied. Open it in Coinbase Wallet browser or MetaMask browser.");
    } catch {
      setStatus(`Copy this Mini App URL manually: ${shareableUrl}`);
    }
  };

  const handleOpenInMetaMaskBrowser = () => {
    if (!shareableUrl) {
      setStatus("Unable to determine the current Mini App link.");
      return;
    }

    const metaMaskUrl = buildMetaMaskDeepLink(shareableUrl);
    try {
      const webApp = window.Telegram?.WebApp;
      if (webApp?.openLink) {
        webApp.openLink(metaMaskUrl, { try_instant_view: false });
        return;
      }

      window.open(metaMaskUrl, "_blank", "noopener,noreferrer");
    } catch {
      setStatus("Unable to open MetaMask automatically. Copy the Mini App link and open it in MetaMask mobile browser.");
    }
  };

  const handleAddBotToGroup = () => {
    try {
      const webApp = window.Telegram?.WebApp;
      if (webApp?.openLink) {
        webApp.openLink(TELEGRAM_BOT_ADD_GROUP_URL, { try_instant_view: false });
        return;
      }

      window.open(TELEGRAM_BOT_ADD_GROUP_URL, "_blank", "noopener,noreferrer");
    } catch {
      setStatus("Unable to open Telegram add-bot flow automatically. Open https://t.me/epwx_bot?startgroup=true manually.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-lg rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-900/50 via-slate-900 to-blue-950 p-6 shadow-2xl">
        <h1 className="text-center text-3xl font-black tracking-tight">Telegram Daily Claim</h1>
        <p className="mt-2 text-center text-sm text-slate-300">
          Verify Telegram session, link or update wallet, then submit your daily EPWX claim.
        </p>

        <CollapsibleSection
          title="Daily Claim"
          description="Collapse this section when not needed. New collapsible sections can be added with the same component."
          isOpen={openSections.dailyClaim}
          onToggle={() => toggleSection("dailyClaim")}
        >
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
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
            {normalizedLinkedWallet && normalizedConnectedWallet && normalizedLinkedWallet !== normalizedConnectedWallet ? (
              <div className="rounded-xl border border-orange-200/35 bg-orange-300/10 px-3 py-2 text-center text-orange-100">
                Connected wallet is different from linked wallet. Tap Update Linked Wallet to switch.
              </div>
            ) : null}
            {remaining ? (
              <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-center text-amber-100">
                Next claim in {remaining}
              </div>
            ) : null}
          </div>

          {isTelegramWebView ? (
            <div className="space-y-3 rounded-2xl border border-orange-300/30 bg-orange-300/10 p-4 text-sm text-orange-50">
              <p>
                Coinbase and MetaMask wallet connections can fail inside Telegram&apos;s in-app browser. If a wallet shows a smart-wallet or URL-scheme error, open this Mini App in an external browser or in the wallet&apos;s own browser instead.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleOpenInExternalBrowser}
                  className="rounded-xl border border-orange-200/40 bg-orange-300/15 px-4 py-3 font-semibold text-orange-50 transition hover:bg-orange-300/25"
                >
                  Open In External Browser
                </button>
                <button
                  type="button"
                  onClick={handleOpenInMetaMaskBrowser}
                  className="rounded-xl border border-orange-200/40 bg-orange-300/15 px-4 py-3 font-semibold text-orange-50 transition hover:bg-orange-300/25"
                >
                  Open In MetaMask Browser
                </button>
                <button
                  type="button"
                  onClick={handleCopyMiniAppLink}
                  className="rounded-xl border border-orange-200/40 bg-orange-300/15 px-4 py-3 font-semibold text-orange-50 transition hover:bg-orange-300/25"
                >
                  Copy Mini App Link
                </button>
              </div>
              <p className="text-xs text-orange-100/80">
                For the cleanest test flow, open the copied link in MetaMask mobile browser, Coinbase Wallet browser, or an external browser, then connect and link the wallet there.
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm text-cyan-50">
            <p className="font-semibold">Group owner quick setup</p>
            <p className="mt-1 text-xs text-cyan-100/90">
              Add @epwx_bot to your Telegram group first. Then promote it as admin and run /registergroup inside the group.
            </p>
            <p className="mt-1 text-xs text-cyan-100/90">
              After registration, run /postdailyclaimbutton in the group and pin that Daily Claim post so members can claim easily.
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-100">
              Reward rule: Group owner receives 10,000 EPWX for each user who successfully submits a daily claim from that group context. This is a lifetime recurring reward model, so owners continue earning per eligible user, per day.
            </p>
            <button
              type="button"
              onClick={handleAddBotToGroup}
              className="mt-3 w-full rounded-xl border border-cyan-200/40 bg-cyan-300/20 px-4 py-3 text-sm font-bold text-cyan-50 transition hover:bg-cyan-300/30"
            >
              Add @epwx_bot To Group
            </button>
          </div>

          <div className="flex justify-center">
            <ConnectKitButton />
          </div>

          <div className="grid gap-3">
            {registerGroupId && !groupRegistrationComplete ? (
              <button
                type="button"
                disabled={busy || !telegramUser || !canClaim}
                onClick={handleRegisterGroup}
                className="rounded-xl border border-fuchsia-200/40 bg-fuchsia-300/15 px-4 py-3 font-semibold text-fuchsia-50 transition hover:bg-fuchsia-300/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === "register" ? "Processing..." : "Register This Group For Owner Rewards"}
              </button>
            ) : groupRegistrationComplete ? (
              <div className="rounded-xl border border-emerald-200/30 bg-emerald-300/10 px-4 py-3 text-center text-sm font-semibold text-emerald-100">
                Group already registered for owner rewards.
              </div>
            ) : null}

            <button
              type="button"
              disabled={busy || !telegramUser || !normalizedConnectedWallet}
              onClick={handleLinkWallet}
              className="rounded-xl border border-cyan-200/40 bg-cyan-300/15 px-4 py-3 font-semibold text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAction === "link" ? "Processing..." : normalizedLinkedWallet ? "Update Linked Wallet" : "Link Wallet"}
            </button>

            <button
              type="button"
              disabled={claimDisabled}
              onClick={handleDailyClaim}
              className="rounded-xl border border-emerald-200/40 bg-emerald-300/15 px-4 py-3 font-semibold text-emerald-50 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAction === "claim" ? "Submitting..." : "Request Daily Claim"}
            </button>

            {claimDisabledReason ? (
              <p className="text-center text-xs text-slate-300">{claimDisabledReason}</p>
            ) : null}
          </div>

          {awaitingWalletSignature ? (
            <div className="rounded-xl border border-amber-200/35 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              <p className="font-semibold">Action required in wallet app</p>
              <p className="mt-1 text-amber-50/90">
                This request is waiting for signature approval. Switch to MetaMask or Coinbase Wallet, approve the signature popup, then return to this page.
              </p>
            </div>
          ) : null}

          {status ? (
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-slate-100">
              {status}
            </div>
          ) : null}
        </CollapsibleSection>
      </section>
    </main>
  );
}
