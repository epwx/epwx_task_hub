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
"use client";

import React from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";


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
  const [ledgerEntries, setLedgerEntries] = React.useState<LedgerEntry[]>([]);

  // Store filtered entries for connected merchant
  const [filteredEntries, setFilteredEntries] = React.useState<LedgerEntry[]>([]);

  React.useEffect(() => {
    fetchLedgerEntries().then(setLedgerEntries);
  }, []);

  React.useEffect(() => {
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

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold">Reward Distribution Ledger</h1>
        <div className="flex items-center gap-2">
          <ConnectKitButton />
          {isConnected && address && (
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 font-mono">
              Connected: {address}
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border px-2 py-1 text-gray-700 dark:text-gray-100">Date</th>
              <th className="border px-2 py-1 text-gray-700 dark:text-gray-100">Merchant</th>
              <th className="border px-2 py-1 text-gray-700 dark:text-gray-100">Customer</th>
              <th className="border px-2 py-1 text-gray-700 dark:text-gray-100">Receipt</th>
              <th className="border px-2 py-1 text-gray-700 dark:text-gray-100">EPWX Amount</th>
              <th className="border px-2 py-1 text-gray-700 dark:text-gray-100">Fiat Value</th>
              <th className="border px-2 py-1 text-gray-700 dark:text-gray-100">Tx Hash</th>
              <th className="border px-2 py-1 text-gray-700 dark:text-gray-100">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry: LedgerEntry) => (
              <tr key={entry.id}>
                <td className="border px-2 py-1">{new Date(entry.date).toLocaleString()}</td>
                <td className="border px-2 py-1">{entry.merchant_name}</td>
                <td className="border px-2 py-1">{entry.customer_id}</td>
                <td className="border px-2 py-1">{entry.receipt_id}</td>
                <td className="border px-2 py-1">{entry.epwx_amount}</td>
                <td className="border px-2 py-1">{entry.fiat_value}</td>
                <td className="border px-2 py-1">{entry.transaction_hash}</td>
                <td className="border px-2 py-1">{entry.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
