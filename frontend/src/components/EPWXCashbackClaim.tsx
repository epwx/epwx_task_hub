import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export function EPWXCashbackClaim() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<{ [txHash: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-lg p-4 mb-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">EPWX Cashback Rewards</h2>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading eligible transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No eligible EPWX swap transactions in the last 3 hours.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-2 text-xs font-semibold text-gray-600">Tx Hash</th>
                <th className="py-2 px-2 text-xs font-semibold text-gray-600">Amount</th>
                <th className="py-2 px-2 text-xs font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.txHash} className="border-b last:border-none">
                  <td className="py-2 px-2 text-xs break-all max-w-[120px] md:max-w-xs">{tx.txHash}</td>
                  <td className="py-2 px-2 text-xs">{tx.amount}</td>
                  <td className="py-2 px-2">
                    {claimed[tx.txHash] ? (
                      <span className="text-green-600 font-bold">Claimed</span>
                    ) : (
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 text-xs md:text-sm w-full md:w-auto"
                        onClick={() => handleClaim(tx)}
                        disabled={claiming === tx.txHash}
                      >
                        {claiming === tx.txHash ? "Claiming..." : "Claim 5% Cashback"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
    </div>
  );
      ) : transactions.length === 0 ? (
        <div>No eligible EPWX swap transactions in the last 3 hours.</div>
      ) : (
        <table className="min-w-full text-left">
          <thead>
            <tr>
              <th className="py-2 px-4">Tx Hash</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx: any) => (
              <tr key={tx.txHash}>
                <td className="py-2 px-4">{tx.txHash}</td>
                <td className="py-2 px-4">{tx.amount}</td>
                <td className="py-2 px-4">
                  {claimed[tx.txHash] ? (
                    <span className="text-green-600">Claimed</span>
                  ) : (
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      disabled={claiming === tx.txHash}
                      onClick={() => handleClaim(tx)}
                    >
                      {claiming === tx.txHash ? 'Claiming...' : 'Claim 3% Cashback'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
