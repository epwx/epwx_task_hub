"use client";

import { Suspense, useEffect, useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useSearchParams } from 'next/navigation';

function MerchantClaimCodePage() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchant');
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [merchant, setMerchant] = useState<{ name: string } | null>(null);
  const [claimCode, setClaimCode] = useState<{ code: string; rewardAmount: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!merchantId) return;
    fetch(`/api/merchants/${merchantId}`)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(setMerchant)
      .catch(() => setError('Merchant not found.'));
  }, [merchantId]);

  const generateCode = async () => {
    if (!merchantId || !address) return;
    setLoading(true);
    setError('');
    setClaimCode(null);
    try {
      const issuedAt = new Date().toISOString();
      const nonce = crypto.randomUUID();
      const message = `EPWX Merchant Claim Code\nMerchant: ${merchantId}\nIssued At: ${issuedAt}\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });
      const response = await fetch(`/api/merchants/${merchantId}/claim-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuedAt, nonce, signature }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) setError(data.error || 'Unable to generate a code.');
      else setClaimCode(data.claimCode);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-950 px-4 py-10 text-white">
      <section className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl sm:p-8">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Merchant Checkout</div>
        <h1 className="mt-2 text-3xl font-black">{merchant?.name || 'Purchase reward'}</h1>
        <p className="mt-3 text-sm text-slate-300">After completing a sale, generate one code and show it to that customer.</p>

        <div className="mt-6">
          {!address ? <ConnectKitButton /> : (
            <button onClick={generateCode} disabled={loading || !merchantId} className="ui-btn-primary w-full rounded-2xl px-4 py-4 text-base font-bold disabled:opacity-60">
              {loading ? 'Generating...' : 'Generate Claim Code'}
            </button>
          )}
        </div>

        {claimCode && (
          <div className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-5 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Customer code</div>
            <div className="mt-3 text-4xl font-black tracking-[0.16em] text-white">{claimCode.code}</div>
            <div className="mt-3 text-sm text-slate-200">Reward: {claimCode.rewardAmount} EPWX</div>
            <div className="mt-1 text-xs text-slate-400">Expires {new Date(claimCode.expiresAt).toLocaleTimeString()}</div>
          </div>
        )}
        {error && <div className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
      </section>
    </main>
  );
}

export default function MerchantClaimCodePageWrapper() {
  return <Suspense fallback={<div>Loading...</div>}><MerchantClaimCodePage /></Suspense>;
}