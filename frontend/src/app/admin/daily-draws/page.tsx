"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { ethers } from "ethers";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { parseJsonResponse } from "@/utils/apiErrors";

type DailyDraw = {
  id: number;
  drawDate: string;
  winnerCount: number;
  eligibleCount: number;
  prizeAmount: string;
  status: string;
  runBy: string;
  runAt: string;
  createdAt: string;
  updatedAt: string;
};

type DailyDrawWinner = {
  id: number;
  drawId: number;
  dailyClaimId: number | null;
  wallet: string;
  rank: number;
  prizeAmount: string;
  status: "pending" | "paid";
  txHash?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const pageShellClass = "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8";
const glassPanelClass = "rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-lg";
const inputClassName = "mt-2 w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20";

function getAdminWallets() {
  const env = process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
  return env.split(",").map((wallet) => wallet.trim().toLowerCase()).filter(Boolean);
}

function getUtcDateInputDefault() {
  return new Date().toISOString().slice(0, 10);
}

function normalizePositiveIntegerString(value: string): string | null {
  const raw = String(value || "").trim().replace(/,/g, "");
  if (!raw) {
    return null;
  }

  const matched = raw.match(/^(\d+)([kKmMbB])?$/);
  if (!matched) {
    return null;
  }

  const base = matched[1].replace(/^0+/, "") || "0";
  const suffix = String(matched[2] || "").toLowerCase();
  const zerosBySuffix: Record<string, number> = {
    "": 0,
    k: 3,
    m: 6,
    b: 9,
  };

  if (!(suffix in zerosBySuffix)) {
    return null;
  }

  if (base === "0") {
    return null;
  }

  return base + "0".repeat(zerosBySuffix[suffix]);
}

const DEFAULT_DAILY_DRAW_PRIZE_AMOUNT =
  normalizePositiveIntegerString(
    process.env.NEXT_PUBLIC_DAILY_DRAW_PRIZE_AMOUNT ||
      process.env.NEXT_PUBLIC_AUTO_DAILY_DRAW_PRIZE_AMOUNT ||
      "1000000"
  ) || "1000000";

const DRAWS_PER_PAGE = 5;
const WINNERS_PER_PAGE = 5;

export default function AdminDailyDrawsPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [draws, setDraws] = useState<DailyDraw[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<DailyDraw | null>(null);
  const [winners, setWinners] = useState<DailyDrawWinner[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [payingWinnerId, setPayingWinnerId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [drawDate, setDrawDate] = useState<string>(getUtcDateInputDefault());
  const [winnerCount, setWinnerCount] = useState<string>("5");
  const [prizeAmount, setPrizeAmount] = useState<string>(DEFAULT_DAILY_DRAW_PRIZE_AMOUNT);
  const [drawsPage, setDrawsPage] = useState<number>(1);
  const [winnersPage, setWinnersPage] = useState<number>(1);

  const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || "0x0000000000000000000000000000000000000000";
  const EPWX_TOKEN_ABI = [
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  const isAdmin = useMemo(() => {
    if (!address) return false;
    return getAdminWallets().includes(address.toLowerCase());
  }, [address]);

  const totalDrawPages = useMemo(() => {
    return Math.max(1, Math.ceil(draws.length / DRAWS_PER_PAGE));
  }, [draws.length]);

  const paginatedDraws = useMemo(() => {
    const start = (drawsPage - 1) * DRAWS_PER_PAGE;
    return draws.slice(start, start + DRAWS_PER_PAGE);
  }, [draws, drawsPage]);

  const totalWinnersPages = useMemo(() => {
    return Math.max(1, Math.ceil(winners.length / WINNERS_PER_PAGE));
  }, [winners.length]);

  const paginatedWinners = useMemo(() => {
    const start = (winnersPage - 1) * WINNERS_PER_PAGE;
    return winners.slice(start, start + WINNERS_PER_PAGE);
  }, [winners, winnersPage]);

  const selectedDrawId = selectedDraw?.id ?? null;

  const fetchWinners = useCallback(async (drawId: number) => {
    try {
      const response = await fetch(`/api/epwx/daily-draws/${drawId}/winners`, { cache: "no-store" });
      const data = await parseJsonResponse<{ draw?: DailyDraw; winners?: DailyDrawWinner[] }>(response, "Failed to fetch draw winners");
      if (data.draw) {
        setSelectedDraw(data.draw);
      }
      setWinners((data.winners || []).sort((a, b) => a.rank - b.rank));
      setWinnersPage(1);
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch draw winners");
    }
  }, []);

  const fetchDraws = useCallback(async () => {
    if (!address || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/epwx/daily-draws?admin=${address}&limit=20`, { cache: "no-store" });
      const data = await parseJsonResponse<{ draws?: DailyDraw[] }>(response, "Failed to fetch daily draws");
      const nextDraws = data.draws || [];
      setDraws(nextDraws);
      setDrawsPage(1);

      if (nextDraws.length === 0) {
        setSelectedDraw(null);
        setWinners([]);
        return;
      }

      const drawToSelect = nextDraws.find((draw) => draw.id === selectedDrawId) || nextDraws[0];
      setSelectedDraw(drawToSelect);

      if (drawToSelect) {
        await fetchWinners(drawToSelect.id);
      }
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch daily draws");
    } finally {
      setLoading(false);
    }
  }, [address, fetchWinners, isAdmin, selectedDrawId]);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  useEffect(() => {
    if (drawsPage > totalDrawPages) {
      setDrawsPage(totalDrawPages);
    }
  }, [drawsPage, totalDrawPages]);

  useEffect(() => {
    if (winnersPage > totalWinnersPages) {
      setWinnersPage(totalWinnersPages);
    }
  }, [winnersPage, totalWinnersPages]);

  const runDraw = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!address || !isAdmin) {
      setError("Connect an admin wallet first");
      return;
    }

    try {
      setRunning(true);
      setError(null);
      setSuccess(null);

      const normalizedPrizeAmount = normalizePositiveIntegerString(prizeAmount);
      if (!normalizedPrizeAmount) {
        setError("Prize amount must be a positive number (examples: 1000000 or 1M)");
        return;
      }

      const response = await fetch("/api/epwx/daily-draws/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin: address,
          drawDate,
          winnerCount,
          prizeAmount: normalizedPrizeAmount,
        }),
      });

      const data = await parseJsonResponse<{ draw: DailyDraw; winners: DailyDrawWinner[] }>(response, "Failed to run daily draw");
      setSelectedDraw(data.draw);
      setWinners((data.winners || []).sort((a, b) => a.rank - b.rank));
      setWinnersPage(1);
      setSuccess(`Daily draw completed for ${data.draw.drawDate}`);
      await fetchDraws();
    } catch (runError: any) {
      setError(runError?.message || "Failed to run daily draw");
    } finally {
      setRunning(false);
    }
  };

  const markWinnerPaid = async (winner: DailyDrawWinner) => {
    if (!address || !isAdmin) {
      setError("Connect an admin wallet first");
      return;
    }

    if (winner.status === "paid") {
      return;
    }

    try {
      setPayingWinnerId(winner.id);
      setError(null);
      setSuccess(null);

      const amount = ethers.parseUnits(String(winner.prizeAmount), 9).toString();
      const txHash = await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [winner.wallet as `0x${string}`, amount],
      });

      if (!publicClient) {
        throw new Error("Public client unavailable");
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error("Token transfer failed or reverted");
      }

      const response = await fetch(`/api/epwx/daily-draws/winners/${winner.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, txHash }),
      });

      await parseJsonResponse<{ winner: DailyDrawWinner }>(response, "Failed to mark winner as paid");

      await fetchWinners(winner.drawId);
      setSuccess(`Winner ${winner.wallet} marked as paid`);
    } catch (payError: any) {
      setError(payError?.message || "Failed to pay winner");
    } finally {
      setPayingWinnerId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-cyan-500/12 blur-[90px] sm:-left-32 sm:h-80 sm:w-80 sm:blur-[130px]" />
          <div className="absolute -right-16 top-20 h-64 w-64 rounded-full bg-blue-600/16 blur-[100px] sm:-right-28 sm:h-96 sm:w-96 sm:blur-[150px]" />
          <div className="absolute bottom-0 left-1/2 h-44 w-[20rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[90px] sm:h-72 sm:w-[38rem] sm:blur-[150px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl py-16 text-center">
          <div className={pageShellClass}>
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Admin Access</div>
              <div className="mt-2 text-2xl font-black text-white">Connect the admin wallet</div>
              <div className="mb-6 mt-3 max-w-lg text-sm text-slate-300">Manage daily winner draws, inspect results, and execute winner payouts from this admin panel.</div>
              <ConnectKitButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-cyan-500/12 blur-[90px] sm:-left-32 sm:h-80 sm:w-80 sm:blur-[130px]" />
        <div className="absolute -right-16 top-20 h-64 w-64 rounded-full bg-blue-600/16 blur-[100px] sm:-right-28 sm:h-96 sm:w-96 sm:blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 h-44 w-[20rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[90px] sm:h-72 sm:w-[38rem] sm:blur-[150px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl min-w-0">
      <section className={`${pageShellClass} mb-6`}>
        <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Daily Draw Admin</div>
            <h1 className="mt-2 text-3xl font-black text-white">Run draws and pay winners</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">Select winners from verified daily claims, publish transparent draw history, and mark payouts with on-chain transaction hashes.</p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Draws</div>
              <div className="mt-2 text-2xl font-black text-white">{draws.length}</div>
            </div>
            <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Winners</div>
              <div className="mt-2 text-2xl font-black text-cyan-200">{winners.length}</div>
            </div>
            <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Wallet</div>
              <div className="mt-2 break-all text-sm font-bold text-emerald-200">{address}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={runDraw} className={pageShellClass}>
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white">Run Daily Winner Draw</h2>
            <p className="mt-2 text-sm text-slate-300">Select date and configuration, then run a random draw from unique daily claim wallets.</p>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-semibold text-slate-200">
                Draw Date (UTC)
                <input
                  type="date"
                  value={drawDate}
                  onChange={(event) => setDrawDate(event.target.value)}
                  className={inputClassName}
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Winner Count
                <input
                  type="number"
                  min={1}
                  value={winnerCount}
                  onChange={(event) => setWinnerCount(event.target.value)}
                  className={inputClassName}
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Prize Amount (EPWX)
                <input
                  type="number"
                  min={1}
                  value={prizeAmount}
                  onChange={(event) => setPrizeAmount(event.target.value)}
                  className={inputClassName}
                  required
                />
              </label>
              <button type="submit" disabled={running} className="ui-btn-primary rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-50">
                {running ? "Running Draw..." : "Run Draw"}
              </button>
            </div>
          </div>
        </form>

        <div className={pageShellClass}>
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white">Recent Draws</h2>
            <div className="mt-4 space-y-3">
              {draws.length === 0 ? <div className="text-sm text-slate-300">No draws yet.</div> : null}
              {paginatedDraws.map((draw) => (
                <button
                  key={draw.id}
                  type="button"
                  onClick={() => fetchWinners(draw.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${selectedDraw?.id === draw.id ? "border-emerald-300/35 bg-emerald-400/15" : "border-white/12 bg-white/[0.04] hover:bg-white/[0.08]"}`}
                >
                  <div className="text-sm font-bold text-white">{draw.drawDate}</div>
                  <div className="mt-1 text-xs text-slate-300">Winners: {draw.winnerCount} | Eligible: {draw.eligibleCount}</div>
                  <div className="text-xs text-slate-300">Prize: {Number(draw.prizeAmount || "0").toLocaleString()} EPWX</div>
                </button>
              ))}

              {draws.length > DRAWS_PER_PAGE ? (
                <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setDrawsPage((page) => Math.max(1, page - 1))}
                    disabled={drawsPage === 1}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-semibold text-slate-300">Page {drawsPage} of {totalDrawPages}</span>
                  <button
                    type="button"
                    onClick={() => setDrawsPage((page) => Math.min(totalDrawPages, page + 1))}
                    disabled={drawsPage === totalDrawPages}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      {success ? <div className="mb-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}

      <div className={pageShellClass}>
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white">Draw Winners{selectedDraw ? ` · ${selectedDraw.drawDate}` : ""}</h1>
          <p className="mt-2 text-sm text-slate-300">Pay winners and record transaction hashes for auditability.</p>

          {loading ? <div className={`${glassPanelClass} mt-4 p-6 text-slate-200`}>Loading draws...</div> : null}
          {!loading && winners.length === 0 ? <div className={`${glassPanelClass} mt-4 p-6 text-sm text-slate-300`}>No winners to display.</div> : null}

          {!loading && winners.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/12 bg-slate-950/45 shadow-[0_16px_40px_rgba(2,6,23,0.25)]">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-white/[0.06] text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Wallet</th>
                    <th className="px-4 py-3 text-left">Prize</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tx Hash</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWinners.map((winner) => (
                    <tr key={winner.id} className="border-t border-white/10">
                      <td className="px-4 py-3">#{winner.rank}</td>
                      <td className="px-4 py-3 break-all">{winner.wallet}</td>
                      <td className="px-4 py-3">{Number(winner.prizeAmount || "0").toLocaleString()} EPWX</td>
                      <td className="px-4 py-3 capitalize">{winner.status}</td>
                      <td className="px-4 py-3 break-all text-xs text-slate-400">{winner.txHash || "-"}</td>
                      <td className="px-4 py-3">
                        {winner.status === "paid" ? (
                          <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">Paid</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markWinnerPaid(winner)}
                            disabled={payingWinnerId === winner.id}
                            className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-50"
                          >
                            {payingWinnerId === winner.id ? "Paying..." : "Pay Winner"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {winners.length > WINNERS_PER_PAGE ? (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setWinnersPage((page) => Math.max(1, page - 1))}
                    disabled={winnersPage === 1}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-semibold text-slate-300">Page {winnersPage} of {totalWinnersPages}</span>
                  <button
                    type="button"
                    onClick={() => setWinnersPage((page) => Math.min(totalWinnersPages, page + 1))}
                    disabled={winnersPage === totalWinnersPages}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
