import React, { useState } from 'react';

interface MerchantCodeClaimProps {
  merchantId: string | number;
  merchantInfo?: { name?: string; address?: string } | null;
  wallet: string;
  initialCode?: string;
}

const MerchantCodeClaim: React.FC<MerchantCodeClaimProps> = ({ merchantId, merchantInfo, wallet, initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setRewardAmount(null);

    try {
      const response = await fetch('/api/claims/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, customer: wallet, code }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'Unable to redeem this code.');
      } else {
        setRewardAmount(data.rewardAmount);
        setCode('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left text-white">
      <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-lg">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Merchant</div>
        <div className="mt-2 text-lg font-black text-white">{merchantInfo?.name}</div>
        <div className="mt-1 text-sm text-slate-300">{merchantInfo?.address}</div>
      </div>
      <label className="block rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-lg">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Purchase code</span>
        <input
          value={code}
          onChange={event => setCode(event.target.value.toUpperCase())}
          required
          maxLength={12}
          autoComplete="one-time-code"
          className="mt-3 w-full rounded-xl border border-white/15 bg-slate-950/50 px-4 py-3 text-center text-xl font-black uppercase tracking-[0.2em] text-white outline-none focus:border-cyan-300/60"
          placeholder="ABCD2345"
        />
      </label>
      <button type="submit" disabled={loading || !code.trim()} className="ui-btn-primary w-full rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? 'Redeeming...' : 'Claim Fixed Reward'}
      </button>
      {rewardAmount && <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">Claim submitted for {rewardAmount} EPWX.</div>}
      {error && <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
      <a href={`/claim?merchant=${encodeURIComponent(String(merchantId))}`} className="block text-center text-sm font-semibold text-cyan-200 hover:text-cyan-100">
        Upload a receipt instead
      </a>
    </form>
  );
};

export default MerchantCodeClaim;