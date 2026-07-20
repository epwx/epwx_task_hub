"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useBalance, useSignMessage } from "wagmi";
import { base } from "wagmi/chains";
import { ethers } from "ethers";
import { HomeSwapCard } from "@/components/HomeSwapCard";

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

type LatestDailyDraw = {
  id: number;
  drawDate: string;
  winnerCount: number;
  eligibleCount: number;
  prizeAmount: string;
};

type LatestDailyDrawWinner = {
  id: number;
  wallet: string;
  rank: number;
  prizeAmount: string;
  status: string;
  txHash?: string | null;
};

type LatestDailyDrawPagination = {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
};

type LatestDailyDrawResponse = {
  draw?: LatestDailyDraw | null;
  winners?: LatestDailyDrawWinner[];
  pagination?: Partial<LatestDailyDrawPagination>;
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
const MID_TIER_DAILY_REWARD = 2_000_000;
const BONUS_DAILY_REWARD = 5_000_000;
const MEGA_DAILY_REWARD = 10_000_000;
const MID_TIER_DAILY_REWARD_THRESHOLD = 10_000_000_000;
const BONUS_DAILY_REWARD_THRESHOLD = 100_000_000_000;
const MEGA_DAILY_REWARD_THRESHOLD = 1_000_000_000_000;
const MINI_APP_FETCH_TIMEOUT_MS = 15000;
const WALLET_SIGNATURE_TIMEOUT_MS = 45000;
const TELEGRAM_BOT_ADD_GROUP_URL = "https://telegram.me/epwx_bot?startgroup=owner_setup";
const LATEST_WINNERS_REFRESH_INTERVAL_MS = 60_000;
const NEXT_DRAW_COUNTDOWN_REFRESH_INTERVAL_MS = 1_000;
const DEFAULT_AUTO_DAILY_DRAW_TIME_UTC = "00:05";
const NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC = String(process.env.NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC || DEFAULT_AUTO_DAILY_DRAW_TIME_UTC).trim();
const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || "0xef5f5751cf3eca6cc3572768298b7783d33d60eb";

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

function formatDuration(msLeft: number): string {
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

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function CollapsibleSection({ title, description, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <section className="ui-surface-strong mt-6 p-4">
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
        <span className="rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-200">
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
  const { data: epwxBalance, isLoading: balanceLoading } = useBalance({
    address,
    token: EPWX_TOKEN_ADDRESS,
    chainId: base.id,
  });

  type ActiveAction = "link" | "claim" | "register";

  const [initData, setInitData] = useState<string>("");
  const [telegramUser, setTelegramUser] = useState<TelegramMiniAppUser | null>(null);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [officialGroupMember, setOfficialGroupMember] = useState<boolean | null>(null);
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
  const swapSectionRef = useRef<HTMLDivElement | null>(null);
  const walletConnectionSectionRef = useRef<HTMLDivElement | null>(null);
  const dailyClaimSectionRef = useRef<HTMLDivElement | null>(null);
  const dailyDrawSectionRef = useRef<HTMLDivElement | null>(null);
  const didAutoFocusLaunchTargetRef = useRef(false);
  const [openSections, setOpenSections] = useState<{ walletBalance: boolean; swap: boolean; groupOwner: boolean; dailyClaim: boolean; dailyDraws: boolean }>({
    walletBalance: false,
    swap: false,
    groupOwner: false,
    dailyClaim: true,
    dailyDraws: false,
  });
  const [latestDraw, setLatestDraw] = useState<LatestDailyDraw | null>(null);
  const [latestDrawWinners, setLatestDrawWinners] = useState<LatestDailyDrawWinner[]>([]);
  const [drawPage, setDrawPage] = useState<number>(1);
  const [drawPagination, setDrawPagination] = useState<LatestDailyDrawPagination>({
    page: 1,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [latestDrawLoading, setLatestDrawLoading] = useState<boolean>(true);
  const [latestDrawError, setLatestDrawError] = useState<string>("");
  const [nextDrawCountdown, setNextDrawCountdown] = useState<string>("Calculating...");
  const [nextDrawAtUtc, setNextDrawAtUtc] = useState<string>("");
  const [showClaimUpgradePrompt, setShowClaimUpgradePrompt] = useState(false);

  const toggleSection = (section: "walletBalance" | "swap" | "groupOwner" | "dailyClaim" | "dailyDraws") => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  let formattedConnectedWalletBalance = "0";
  const normalizedConnectedWalletBalance = Number(epwxBalance?.formatted || 0);
  if (epwxBalance) {
    try {
      formattedConnectedWalletBalance = formatEpwxBalance(Number(epwxBalance.formatted));
    } catch {
      formattedConnectedWalletBalance = "0";
    }
  }

  const normalizedConnectedWallet = useMemo(() => normalizeWallet(address), [address]);
  const normalizedLinkedWallet = useMemo(() => normalizeWallet(linkedWallet || undefined), [linkedWallet]);
  const nextTierTarget = normalizedConnectedWalletBalance >= MEGA_DAILY_REWARD_THRESHOLD
    ? null
    : normalizedConnectedWalletBalance >= BONUS_DAILY_REWARD_THRESHOLD
      ? MEGA_DAILY_REWARD_THRESHOLD
      : normalizedConnectedWalletBalance >= MID_TIER_DAILY_REWARD_THRESHOLD
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
    : Math.max(nextTierTarget - normalizedConnectedWalletBalance, 0);
  const busy = activeAction !== null;
  const canClaim = Boolean(
    initData &&
      normalizedConnectedWallet &&
      normalizedLinkedWallet &&
      normalizedConnectedWallet === normalizedLinkedWallet
  );
  const claimOnCooldown = Boolean(nextClaimAt && nextClaimAt > Date.now());
  const claimDisabled = busy || !canClaim || claimOnCooldown;

  const openUpgradeAction = (section: "swap" | "dailyDraws") => {
    setOpenSections((current) => ({
      ...current,
      [section]: true,
    }));

    const target = section === "swap" ? swapSectionRef.current : dailyDrawSectionRef.current;
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
    setShowClaimUpgradePrompt(false);
  };

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
    if (didAutoFocusLaunchTargetRef.current || registerGroupId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const hasConnectedWallet = Boolean(normalizedConnectedWallet);

      setOpenSections((current) => ({
        ...current,
        walletBalance: !hasConnectedWallet,
        dailyClaim: hasConnectedWallet,
        dailyDraws: false,
      }));

      const targetSection = hasConnectedWallet ? dailyClaimSectionRef.current : walletConnectionSectionRef.current;
      targetSection?.scrollIntoView({ block: "start", behavior: "smooth" });
      didAutoFocusLaunchTargetRef.current = true;
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [initData, normalizedConnectedWallet, registerGroupId]);

  useEffect(() => {
    if (!isTelegramWebView || registerGroupId || !didAutoFocusLaunchTargetRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const hasConnectedWallet = Boolean(normalizedConnectedWallet);

      setOpenSections((current) => ({
        ...current,
        walletBalance: !hasConnectedWallet,
        dailyClaim: hasConnectedWallet,
        dailyDraws: false,
      }));

      const targetSection = hasConnectedWallet ? dailyClaimSectionRef.current : walletConnectionSectionRef.current;
      targetSection?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [normalizedConnectedWallet, isTelegramWebView, registerGroupId]);

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

    const fetchLatestDraws = async (silent = false) => {
      if (!silent) {
        setLatestDrawLoading(true);
      }
      setLatestDrawError("");

      try {
        const res = await fetchWithTimeout(`/api/epwx/daily-draws/latest?page=${drawPage}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(await readApiError(res, "Failed to load latest daily draws."));
        }

        const data = (await res.json()) as LatestDailyDrawResponse;
        if (!isMounted) {
          return;
        }

        setLatestDraw(data.draw || null);
        setLatestDrawWinners(Array.isArray(data.winners) ? data.winners : []);
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
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLatestDraw(null);
        setLatestDrawWinners([]);
        setDrawPagination({
          page: 1,
          totalPages: 1,
          hasPrevPage: false,
          hasNextPage: false,
        });
        setLatestDrawError(error instanceof Error ? error.message : "Failed to load latest daily draws.");
      } finally {
        if (isMounted && !silent) {
          setLatestDrawLoading(false);
        }
      }
    };

    fetchLatestDraws();
    const intervalId = window.setInterval(() => {
      fetchLatestDraws(true);
    }, LATEST_WINNERS_REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [drawPage]);

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
          setOfficialGroupMember(null);
          setLoadingAuth(false);
          return;
        }

        setTelegramUser(data.telegramUser);
        setLinkedWallet(data.linkedWallet || null);
        setOfficialGroupMember(typeof data.officialGroupMember === "boolean" ? data.officialGroupMember : null);
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
        setOfficialGroupMember(null);
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
      const isRetryableViaProvider = /switch chain|switch network|unsupported chain|chain not configured|unknown rpc/i.test(rawMessage);
      if (!isRetryableViaProvider || !window.ethereum) {
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
        } else if (/rejected|denied|cancelled|canceled/i.test(rawMessage)) {
          setStatus("Wallet signature was cancelled in your wallet app.");
        } else if (/unknown rpc/i.test(rawMessage)) {
          setStatus("Wallet link failed: signing not supported in this browser. Open the Mini App in MetaMask or Coinbase Wallet browser and try again.");
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
    setShowClaimUpgradePrompt(false);
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
      if (nextTierTarget && nextTierReward) {
        setShowClaimUpgradePrompt(true);
      }
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 pb-8 pt-4 text-slate-100 sm:pt-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-blue-600/12 blur-[130px]" />
      </div>
      <section className="ui-surface-strong relative mx-auto max-w-2xl overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="relative z-10">
        <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Telegram Mini App</p>
        <h1 className="mt-3 text-center text-3xl font-black leading-[1.2] tracking-tight text-white">Telegram Daily Claim</h1>
        <p className="mt-2 text-center text-sm text-slate-300">
          Verify Telegram session, link or update wallet, then submit your daily EPWX claim.
        </p>

        <div ref={swapSectionRef} className="scroll-mt-28 sm:scroll-mt-24">
          <CollapsibleSection
            title="Swap ETH To EPWX"
            description="Use the same swap flow from the dapp homepage directly inside the mini app."
            isOpen={openSections.swap}
            onToggle={() => toggleSection("swap")}
          >
            <div className="-mx-2 sm:mx-0">
              <HomeSwapCard compact />
            </div>
          </CollapsibleSection>
        </div>

        <div ref={walletConnectionSectionRef} className="scroll-mt-28 sm:scroll-mt-24">
          <CollapsibleSection
            title="Wallet Connection & EPWX Balance"
            description="Connect wallet, open in external wallet browsers, and view EPWX balance using the main dapp implementation."
            isOpen={openSections.walletBalance}
            onToggle={() => toggleSection("walletBalance")}
          >
          <div className="ui-surface space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Connected wallet</span>
              <span
                className="truncate text-right font-mono text-xs text-slate-200"
                title={normalizedConnectedWallet || "-"}
              >
                {normalizedConnectedWallet ? shortenAddress(normalizedConnectedWallet) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">EPWX balance</span>
              <span className="text-lg font-bold text-cyan-100">
                {normalizedConnectedWallet ? (balanceLoading ? "Loading..." : `${formattedConnectedWalletBalance} EPWX`) : "Connect wallet"}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <ConnectKitButton />
          </div>

          <div className="rounded-2xl border border-cyan-300/35 bg-cyan-500/10 p-4 text-sm text-cyan-50">
            <p>
              Coinbase and MetaMask wallet connections can fail inside Telegram&apos;s in-app browser. If a wallet shows a smart-wallet or URL-scheme error, open this Mini App in an external browser or in the wallet&apos;s own browser instead.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleOpenInExternalBrowser}
                className="ui-btn-muted rounded-xl px-4 py-3"
              >
                Open In External Browser
              </button>
              <button
                type="button"
                onClick={handleOpenInMetaMaskBrowser}
                className="ui-btn-muted rounded-xl px-4 py-3"
              >
                Open In MetaMask Browser
              </button>
              <button
                type="button"
                onClick={handleCopyMiniAppLink}
                className="ui-btn-muted rounded-xl px-4 py-3"
              >
                Copy Mini App Link
              </button>
            </div>
            <p className="text-xs text-cyan-100/85">
              For the cleanest test flow, open the copied link in MetaMask mobile browser, Coinbase Wallet browser, or an external browser, then connect and link the wallet there.
            </p>
          </div>
          </CollapsibleSection>
        </div>

        <div ref={dailyClaimSectionRef} className="scroll-mt-28 sm:scroll-mt-24">
          <CollapsibleSection
            title="Daily Claim"
            description="Collapse this section when not needed. New collapsible sections can be added with the same component."
            isOpen={openSections.dailyClaim}
            onToggle={() => toggleSection("dailyClaim")}
          >
          <div className="ui-surface space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Telegram</span>
              <span className="font-semibold text-cyan-100">
                {loadingAuth ? "Checking..." : telegramUser ? "Verified" : "Not verified"}
              </span>
            </div>
            {officialGroupMember === false ? (
              <div className="rounded-xl border border-amber-300/35 bg-amber-500/10 px-3 py-2 text-center text-amber-100">
                Official Telegram group not verified. Daily rewards are paid at 50% until this wallet is group verified.
              </div>
            ) : null}
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
              <div className="rounded-xl border border-amber-300/35 bg-amber-500/10 px-3 py-2 text-center text-amber-100">
                Connected wallet is different from linked wallet. Tap Update Linked Wallet to switch.
              </div>
            ) : null}
            {remaining ? (
              <div className="rounded-xl border border-sky-300/35 bg-sky-500/10 px-3 py-2 text-center text-sky-100">
                Next claim in {remaining}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              disabled={busy || !telegramUser || !normalizedConnectedWallet}
              onClick={handleLinkWallet}
              className="ui-btn-primary rounded-xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAction === "link" ? "Processing..." : normalizedLinkedWallet ? "Update Linked Wallet" : "Link Wallet"}
            </button>

            <button
              type="button"
              disabled={claimDisabled}
              onClick={handleDailyClaim}
              className="ui-btn-primary rounded-xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAction === "claim" ? "Submitting..." : "Request Daily Claim"}
            </button>

            {claimDisabledReason ? (
              <p className="text-center text-xs text-slate-300">{claimDisabledReason}</p>
            ) : null}
          </div>

          {awaitingWalletSignature ? (
            <div className="rounded-xl border border-sky-300/35 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              <p className="font-semibold">Action required in wallet app</p>
              <p className="mt-1 text-sky-50/90">
                This request is waiting for signature approval. Switch to MetaMask or Coinbase Wallet, approve the signature popup, then return to this page.
              </p>
            </div>
          ) : null}

            {status ? (
              <div className="ui-surface rounded-xl px-3 py-3 text-sm text-slate-100">
                {status}
              </div>
            ) : null}
          </CollapsibleSection>
        </div>

        <div ref={dailyDrawSectionRef} className="scroll-mt-28 sm:scroll-mt-24">
        <CollapsibleSection
          title="Daily Draws & Winners"
          description="Live draw details from the main dapp feed, including countdown and winner payouts."
          isOpen={openSections.dailyDraws}
          onToggle={() => toggleSection("dailyDraws")}
        >
          <div className="ui-surface p-4 text-sm text-white">
            <div className="text-xs uppercase tracking-[0.2em] text-white/80">Next Draw Countdown</div>
            <div className="mt-1 text-2xl font-black text-cyan-100">{nextDrawCountdown}</div>
            <div className="mt-1 text-xs text-white/85">Next scheduled run: {nextDrawAtUtc || "-"}</div>
            <div className="mt-1 text-xs text-white/80">Schedule source: {NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC} UTC</div>
          </div>

          {latestDrawLoading ? <div className="text-center text-sm text-white/90">Loading latest winners...</div> : null}
          {!latestDrawLoading && latestDrawError ? <div className="text-center text-sm text-rose-100">{latestDrawError}</div> : null}
          {!latestDrawLoading && !latestDrawError && !latestDraw ? <div className="text-center text-sm text-white/90">No draw has been completed yet.</div> : null}

          {!latestDrawLoading && !latestDrawError && latestDraw ? (
            <>
              <div className="ui-surface p-4 text-sm text-white/95">
                <div className="text-xs uppercase tracking-[0.2em] text-white/80">Draw Date</div>
                <div className="mt-1 text-xl font-black text-white">{latestDraw.drawDate}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>Winners: <span className="font-bold text-white">{latestDraw.winnerCount}</span></div>
                  <div>Eligible Wallets: <span className="font-bold text-white">{latestDraw.eligibleCount}</span></div>
                  <div>Prize Per Winner: <span className="font-bold text-cyan-100">{Number(latestDraw.prizeAmount || "0").toLocaleString()} EPWX</span></div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setDrawPage((current) => Math.max(1, current - 1))}
                    disabled={!drawPagination.hasPrevPage}
                    className="ui-btn-muted rounded-lg px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Prev Draw
                  </button>
                  <span className="text-xs font-semibold text-white/85">Draw Page {drawPagination.page} of {drawPagination.totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setDrawPage((current) => current + 1)}
                    disabled={!drawPagination.hasNextPage}
                    className="ui-btn-muted rounded-lg px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Next Draw
                  </button>
                </div>
              </div>

              {latestDrawWinners.length === 0 ? (
                <div className="text-center text-sm text-white/90">No winners available for this draw yet.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {latestDrawWinners
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .map((winner) => (
                      <div key={winner.id} className="ui-surface p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-black text-white">Winner #{winner.rank}</div>
                          <span className={`ui-status ${winner.status === "paid" ? "ui-status-success" : "ui-status-warning"}`}>
                            {winner.status === "paid" ? "Paid" : "Pending"}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-white/95">Wallet: <span className="font-mono text-xs">{shortenAddress(winner.wallet)}</span></div>
                        <div className="mt-1 text-sm text-white/90">Prize: {Number(winner.prizeAmount || "0").toLocaleString()} EPWX</div>
                        {winner.txHash ? (
                          <a
                            href={`https://basescan.org/tx/${winner.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block break-all text-xs text-cyan-100 underline decoration-cyan-200/80 underline-offset-2 hover:text-white"
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
        </CollapsibleSection>
        </div>

        {showClaimUpgradePrompt && nextTierTarget && nextTierReward ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="ui-surface-strong relative w-full max-w-lg p-6 text-white shadow-2xl">
              <button
                type="button"
                className="absolute right-3 top-2 text-2xl font-bold text-white/60 hover:text-white"
                onClick={() => setShowClaimUpgradePrompt(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Next tier unlocked by buying</div>
              <h3 className="mt-3 text-2xl font-black text-white">Turn today&apos;s claim into a bigger claim tomorrow</h3>
              <p className="mt-3 text-sm leading-7 text-white/80">
                You claimed your daily reward. Buy or hold {formatEpwxBalance(tokensToNextTier)} more EPWX to move this wallet to the next tier and unlock {nextTierReward.toLocaleString()} EPWX per daily claim.
              </p>
              <p className="mt-2 text-sm leading-7 text-cyan-100/90">
                Target balance: {nextTierTarget.toLocaleString()} EPWX.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openUpgradeAction("swap")}
                  className="ui-btn-primary inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm"
                >
                  Buy EPWX Now
                </button>
                <button
                  type="button"
                  onClick={() => openUpgradeAction("dailyDraws")}
                  className="ui-btn-muted inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm"
                >
                  View Daily Draws
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <CollapsibleSection
          title="Telegram Group Owner Quick Setup"
          description="Owner-only setup for group registration and posting the daily claim button."
          isOpen={openSections.groupOwner}
          onToggle={() => toggleSection("groupOwner")}
        >
          <div className="ui-surface p-4 text-sm text-white">
            <p className="font-semibold">Group owner quick setup</p>
            <p className="mt-1 text-xs text-white/85">
              Add @epwx_bot to your Telegram group first. Then promote it as admin and run /registergroup inside the group.
            </p>
            <p className="mt-1 text-xs text-white/85">
              After registration, run /postdailyclaimbutton in the group and pin that Daily Claim post so members can claim easily.
            </p>
            <p className="mt-2 text-xs font-semibold text-cyan-100">
              Reward rule: Group owner receives 10,000 EPWX for each user who successfully submits a daily claim from that group context. This is a lifetime recurring reward model, so owners continue earning per eligible user, per day.
            </p>
            <a
              href={TELEGRAM_BOT_ADD_GROUP_URL}
              className="ui-btn-primary mt-3 block w-full rounded-xl px-4 py-3 text-center text-sm"
            >
              Add @epwx_bot To Group
            </a>

            {registerGroupId && !groupRegistrationComplete ? (
              <button
                type="button"
                disabled={busy || !telegramUser || !canClaim}
                onClick={handleRegisterGroup}
                className="ui-btn-primary mt-3 w-full rounded-xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === "register" ? "Processing..." : "Register This Group For Owner Rewards"}
              </button>
            ) : groupRegistrationComplete ? (
              <div className="mt-3 rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-4 py-3 text-center text-sm font-semibold text-cyan-100">
                Group already registered for owner rewards.
              </div>
            ) : null}
          </div>
        </CollapsibleSection>
        </div>
      </section>
    </main>
  );
}
