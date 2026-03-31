"use client";
import React from "react";


const fetchLedgerEntries = async () => {
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

export default async function RewardLedgerPage() {
  const ledgerEntries = await fetchLedgerEntries();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reward Distribution Ledger</h1>
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
          {ledgerEntries.map((entry) => (
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
  );
}
