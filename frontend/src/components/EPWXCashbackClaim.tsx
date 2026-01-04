import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export function EPWXCashbackClaim() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<{ [txHash: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/epwx/purchases?wallet=${address}&hours=3`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [address]);

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

  if (!address) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">EPWX Cashback Rewards</h2>
      {loading ? (
        <div>Loading eligible transactions...</div>
      ) : transactions.length === 0 ? (
        <div>No eligible EPWX purchase transactions in the last 3 hours.</div>
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
