import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export function EPWXCashbackClaim() {
    const handleClaim = async (tx: any) => {
      setClaiming(tx.txHash);
      setError(null);
      try {
        const res = await fetch('/api/epwx/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: address, txHash: tx.txHash, amount: tx.amount })
        });
        const data = await res.json();
        if (data.success) {
          setClaimed(prev => ({ ...prev, [tx.txHash]: true }));
        } else {
          setError(data.error || 'Claim failed');
        }
      } catch (e) {
        setError('Claim failed');
      }
      setClaiming(null);
    };
  const { address } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<{ [txHash: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    fetch(`https://api.epowex.com/api/epwx/purchases?wallet=${address}&hours=3`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => {
        setTransactions([]);
        setLoading(false);
      });
  }, [address]);

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
                  <td className="py-2 px-2 text-xs break-all max-w-[120px] md:max-w-xs text-gray-900 bg-white">{tx.txHash}</td>
                  <td className="py-2 px-2 text-xs text-gray-900 bg-white">{tx.amount}</td>
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
// ...existing code...
}
