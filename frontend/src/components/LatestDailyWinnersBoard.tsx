"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { parseJsonResponse } from "@/utils/apiErrors";
import { formatDuration, formatWalletAddress } from "@/utils/homeFormat";
import { ShareIcon } from "@/components/icons/SocialIcons";
import {
  themedSectionClass,
  glassPanelClass,
  NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC,
  LATEST_WINNERS_REFRESH_INTERVAL_MS,
  NEXT_DRAW_COUNTDOWN_REFRESH_INTERVAL_MS,
} from "@/app/homeConstants";

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

export default function LatestDailyWinnersBoard({ referralLink }: { referralLink?: string }) {
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
    <section id="latest-winners" className="py-12 scroll-mt-36">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-black mb-4 text-slate-100 text-center">Latest Daily Winners</h2>
        <div className={`${themedSectionClass} w-full max-w-5xl`}>
          <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 text-white">
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">Daily Draw Results</p>
              <h3 className="mt-2 text-2xl font-black sm:text-3xl">Transparent winners for each daily draw</h3>
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
