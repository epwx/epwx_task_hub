"use client";

import { useEffect, useMemo, useState } from "react";
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

const themedSectionClass = "relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8";
const glassPanelClass = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl";

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

  const base = BigInt(matched[1]);
  const suffix = String(matched[2] || "").toLowerCase();
  const multiplierBySuffix: Record<string, bigint> = {
    "": 1n,
    k: 1000n,
    m: 1000000n,
    b: 1000000000n,
  };

  const multiplier = multiplierBySuffix[suffix];
  if (!multiplier) {
    return null;
  }

  const normalized = base * multiplier;
  if (normalized <= 0n) {
    return null;
  }

  return normalized.toString();
}

const DEFAULT_DAILY_DRAW_PRIZE_AMOUNT =
  normalizePositiveIntegerString(
    process.env.NEXT_PUBLIC_DAILY_DRAW_PRIZE_AMOUNT ||
      process.env.NEXT_PUBLIC_AUTO_DAILY_DRAW_PRIZE_AMOUNT ||
      "1000000"
  ) || "1000000";

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

  const fetchDraws = async () => {
    if (!address || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/epwx/daily-draws?admin=${address}&limit=20`, { cache: "no-store" });
      const data = await parseJsonResponse<{ draws?: DailyDraw[] }>(response, "Failed to fetch daily draws");
      const nextDraws = data.draws || [];
      setDraws(nextDraws);

      if (nextDraws.length === 0) {
        setSelectedDraw(null);
        setWinners([]);
        return;
      }

      const selectedStillExists = selectedDraw && nextDraws.some((draw) => draw.id === selectedDraw.id);
      const drawToSelect = selectedStillExists ? selectedDraw : nextDraws[0];
      setSelectedDraw(drawToSelect);

      if (drawToSelect) {
        await fetchWinners(drawToSelect.id);
      }
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch daily draws");
    } finally {
      setLoading(false);
    }
  };

  const fetchWinners = async (drawId: number) => {
    try {
      const response = await fetch(`/api/epwx/daily-draws/${drawId}/winners`, { cache: "no-store" });
      const data = await parseJsonResponse<{ draw?: DailyDraw; winners?: DailyDrawWinner[] }>(response, "Failed to fetch draw winners");
      if (data.draw) {
        setSelectedDraw(data.draw);
      }
      setWinners((data.winners || []).sort((a, b) => a.rank - b.rank));
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch draw winners");
    }
  };

  useEffect(() => {
    fetchDraws();
  }, [address, isAdmin]);

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

      const data = await parseJsonResponse<{ winner: DailyDrawWinner }>(response, "Failed to mark winner as paid");

      setWinners((current) =>
        current.map((item) => (item.id === winner.id ? data.winner : item)).sort((a, b) => a.rank - b.rank)
      );
      setSuccess(`Winner ${winner.wallet} marked as paid`);
    } catch (payError: any) {
      setError(payError?.message || "Failed to pay winner");
    } finally {
      setPayingWinnerId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className={themedSectionClass}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 text-lg font-semibold text-white">Connect an admin wallet to manage daily random draws.</div>
            <ConnectKitButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={runDraw} className={themedSectionClass}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white">Run Daily Winner Draw</h2>
            <p className="mt-2 text-sm text-white/75">Select date and configuration, then run a random draw from unique daily claim wallets.</p>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-semibold text-white/85">
                Draw Date (UTC)
                <input
                  type="date"
                  value={drawDate}
                  onChange={(event) => setDrawDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-white/85">
                Winner Count
                <input
                  type="number"
                  min={1}
                  value={winnerCount}
                  onChange={(event) => setWinnerCount(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-white/85">
                Prize Amount (EPWX)
                <input
                  type="number"
                  min={1}
                  value={prizeAmount}
                  onChange={(event) => setPrizeAmount(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white"
                  required
                />
              </label>
              <button type="submit" disabled={running} className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
                {running ? "Running Draw..." : "Run Draw"}
              </button>
            </div>
          </div>
        </form>

        <div className={themedSectionClass}>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white">Recent Draws</h2>
            <div className="mt-4 space-y-3">
              {draws.length === 0 ? <div className="text-sm text-white/75">No draws yet.</div> : null}
              {draws.map((draw) => (
                <button
                  key={draw.id}
                  type="button"
                  onClick={() => fetchWinners(draw.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${selectedDraw?.id === draw.id ? "border-white/40 bg-white/15" : "border-white/20 bg-white/5 hover:bg-white/10"}`}
                >
                  <div className="text-sm font-bold text-white">{draw.drawDate}</div>
                  <div className="mt-1 text-xs text-white/70">Winners: {draw.winnerCount} | Eligible: {draw.eligibleCount}</div>
                  <div className="text-xs text-white/70">Prize: {Number(draw.prizeAmount || "0").toLocaleString()} EPWX</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-2xl border border-red-200/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {success ? <div className="mb-4 rounded-2xl border border-emerald-200/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}

      <div className={themedSectionClass}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white">Draw Winners{selectedDraw ? ` · ${selectedDraw.drawDate}` : ""}</h1>
          <p className="mt-2 text-sm text-white/75">Pay winners and record transaction hashes for auditability.</p>

          {loading ? <div className={`${glassPanelClass} mt-4 p-6 text-white/80`}>Loading draws...</div> : null}
          {!loading && winners.length === 0 ? <div className={`${glassPanelClass} mt-4 p-6 text-sm text-white/75`}>No winners to display.</div> : null}

          {!loading && winners.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full rounded-xl border border-white/15 bg-white/5 text-sm text-white">
                <thead className="bg-white/10 text-white/90">
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
                  {winners.map((winner) => (
                    <tr key={winner.id} className="border-t border-white/10">
                      <td className="px-4 py-3">#{winner.rank}</td>
                      <td className="px-4 py-3 break-all">{winner.wallet}</td>
                      <td className="px-4 py-3">{Number(winner.prizeAmount || "0").toLocaleString()} EPWX</td>
                      <td className="px-4 py-3 capitalize">{winner.status}</td>
                      <td className="px-4 py-3 break-all text-xs text-white/75">{winner.txHash || "-"}</td>
                      <td className="px-4 py-3">
                        {winner.status === "paid" ? (
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">Paid</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markWinnerPaid(winner)}
                            disabled={payingWinnerId === winner.id}
                            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                          >
                            {payingWinnerId === winner.id ? "Paying..." : "Pay Winner"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
