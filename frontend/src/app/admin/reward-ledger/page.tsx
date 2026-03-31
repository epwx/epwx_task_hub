"use client";
import React from "react";

// Placeholder for fetching data from backend API
const fetchLedgerEntries = async () => {
  // Replace with actual API call
  return [
    {
      id: 1,
      date: "2026-03-30T12:00:00Z",
      merchant_name: "Test Merchant",
      customer_id: "cust123",
      receipt_id: "rcpt001",
      epwx_amount: "100.5",
      fiat_value: "50.25",
      transaction_hash: "0xabc123",
      notes: "Test entry",
    },
  ];
};

export default async function RewardLedgerPage() {
  const ledgerEntries = await fetchLedgerEntries();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reward Distribution Ledger</h1>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Merchant</th>
            <th className="border px-2 py-1">Customer</th>
            <th className="border px-2 py-1">Receipt</th>
            <th className="border px-2 py-1">EPWX Amount</th>
            <th className="border px-2 py-1">Fiat Value</th>
            <th className="border px-2 py-1">Tx Hash</th>
            <th className="border px-2 py-1">Notes</th>
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
