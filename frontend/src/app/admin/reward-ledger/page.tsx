"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

type LedgerEntry = {
  id: number;
  date: string;
  merchant_name: string;
  customer_id: string;
  receipt_id: string;
  epwx_amount: string;
  fiat_value: string;
  transaction_hash: string;
  notes: string;
};

const pageShellClass = "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8";
const glassPanelClass = "rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-lg";

const fetchLedgerEntries = async (): Promise<LedgerEntry[]> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/reward-ledger`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to fetch ledger entries");
    const data = await res.json();
    return data.entries || [];
  } catch (e) {
    return [];
  }
};

export default function RewardLedgerPage() {

  const { address, isConnected } = useAccount();
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Store filtered entries for connected merchant
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadEntries = async () => {
      setLoading(true);
      const entries = await fetchLedgerEntries();
      if (!cancelled) {
        setLedgerEntries(entries);
        setLoading(false);
      }
    };

    loadEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (address) {
      // Filter entries where merchant_name (wallet) matches connected address (case-insensitive)
      setFilteredEntries(
        ledgerEntries.filter(
          (entry) => entry.customer_id && entry.merchant_name && entry.merchant_name.toLowerCase() === address.toLowerCase()
        )
      );
    } else {
      setFilteredEntries(ledgerEntries);
    }
  }, [ledgerEntries, address]);

  const totalDistributedEpwx = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => acc + Number(entry.epwx_amount || 0), 0);
  }, [filteredEntries]);

  const txRecordedCount = useMemo(() => {
    return filteredEntries.filter((entry) => Boolean(entry.transaction_hash)).length;
  }, [filteredEntries]);

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
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Reward Ledger</div>
              <h1 className="mt-2 text-3xl font-black text-white">Reward Distribution Ledger</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">Review reward-distribution history with merchant/customer references, receipt links, amounts, and recorded payout hashes.</p>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Entries</div>
                <div className="mt-2 text-2xl font-black text-white">{filteredEntries.length}</div>
              </div>
              <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">EPWX Total</div>
                <div className="mt-2 text-2xl font-black text-cyan-200">{totalDistributedEpwx.toLocaleString()}</div>
              </div>
              <div className={`${glassPanelClass} min-w-0 px-4 py-3`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tx Recorded</div>
                <div className="mt-2 text-2xl font-black text-emerald-200">{txRecordedCount}</div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${pageShellClass} mb-6`}>
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className={`${glassPanelClass} px-4 py-3 text-xs text-slate-300 sm:text-sm`}>
              <span className="font-semibold text-slate-100">Scope:</span>{" "}
              {isConnected && address
                ? "Showing entries matched to your connected wallet in merchant field."
                : "Connect wallet to view wallet-scoped entries, otherwise all recent entries are shown."}
            </div>
            <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-end">
              <ConnectKitButton />
              {isConnected && address ? (
                <span className="max-w-full break-all rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-mono text-emerald-200">
                  Connected: {address}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className={pageShellClass}>
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white">Ledger Entries</h2>
            <p className="mt-2 text-sm text-slate-300">Latest 100 records ordered by timestamp from the backend ledger table.</p>

            {loading ? (
              <div className={`${glassPanelClass} mt-4 p-6 text-slate-200`}>Loading ledger entries...</div>
            ) : null}

            {!loading && filteredEntries.length === 0 ? (
              <div className={`${glassPanelClass} mt-4 p-6 text-sm text-slate-300`}>No reward-ledger entries found for the current filter.</div>
            ) : null}

            {!loading && filteredEntries.length > 0 ? (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-white/12 bg-slate-950/45 shadow-[0_16px_40px_rgba(2,6,23,0.25)]">
                <table className="min-w-full text-sm text-white">
                  <thead className="bg-white/[0.06] text-slate-300">
                    <tr>
                      <th className="px-3 py-3 text-left">Date</th>
                      <th className="px-3 py-3 text-left">Merchant</th>
                      <th className="px-3 py-3 text-left">Customer</th>
                      <th className="px-3 py-3 text-left">Receipt</th>
                      <th className="px-3 py-3 text-left">EPWX Amount</th>
                      <th className="px-3 py-3 text-left">Fiat Value</th>
                      <th className="px-3 py-3 text-left">Tx Hash</th>
                      <th className="px-3 py-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry: LedgerEntry) => (
                      <tr key={entry.id} className="border-t border-white/10">
                        <td className="px-3 py-3 text-slate-200">{new Date(entry.date).toLocaleString()}</td>
                        <td className="px-3 py-3 break-all text-slate-100">{entry.merchant_name || "-"}</td>
                        <td className="px-3 py-3 break-all text-slate-100">{entry.customer_id || "-"}</td>
                        <td className="px-3 py-3 break-all text-slate-100">{entry.receipt_id || "-"}</td>
                        <td className="px-3 py-3 font-semibold text-cyan-100">{Number(entry.epwx_amount || 0).toLocaleString()}</td>
                        <td className="px-3 py-3 text-slate-200">{entry.fiat_value || "-"}</td>
                        <td className="px-3 py-3 break-all text-xs text-slate-400">{entry.transaction_hash || "-"}</td>
                        <td className="px-3 py-3 text-slate-200">{entry.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
