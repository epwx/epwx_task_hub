'use client';

import { useEffect, useMemo, useState } from 'react';

type SupplySnapshot = {
  totalSupply: number;
  circulatingSupply: number;
  burnedSupply: number;
};

type SupplySlice = {
  label: string;
  value: number;
  color: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.epowex.com';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function formatWhole(value: number) {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function TokenSupplyPieChart() {
  const [snapshot, setSnapshot] = useState<SupplySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSupply = async () => {
      setLoading(true);
      try {
        const [totalResponse, circulatingResponse, burnedResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/supply`, { cache: 'no-store' }),
          fetch(`${API_BASE_URL}/api/circulating`, { cache: 'no-store' }),
          fetch(`${API_BASE_URL}/api/burned`, { cache: 'no-store' }),
        ]);

        const [totalPayload, circulatingPayload, burnedPayload] = await Promise.all([
          totalResponse.json(),
          circulatingResponse.json(),
          burnedResponse.json(),
        ]);

        if (!totalResponse.ok || !circulatingResponse.ok || !burnedResponse.ok) {
          throw new Error(
            totalPayload?.error || circulatingPayload?.error || burnedPayload?.error || 'Failed to fetch token supply data.'
          );
        }

        if (cancelled) return;

        setSnapshot({
          totalSupply: Number(totalPayload.totalSupply || 0),
          circulatingSupply: Number(circulatingPayload.circulatingSupply || 0),
          burnedSupply: Number(burnedPayload.burnedSupply || 0),
        });
        setError(null);
      } catch (fetchError: any) {
        if (cancelled) return;
        setSnapshot(null);
        setError(fetchError?.message || 'Failed to fetch token supply data.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSupply();
    const intervalId = window.setInterval(loadSupply, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const { slices, totalSupply } = useMemo(() => {
    if (!snapshot || snapshot.totalSupply <= 0) {
      return { slices: [] as SupplySlice[], totalSupply: 0 };
    }

    const lockedSupply = Math.max(snapshot.totalSupply - snapshot.circulatingSupply - snapshot.burnedSupply, 0);
    const nextSlices: SupplySlice[] = [
      { label: 'Circulating', value: Math.max(snapshot.circulatingSupply, 0), color: '#22c55e' },
      { label: 'Burned', value: Math.max(snapshot.burnedSupply, 0), color: '#9ca3af' },
    ];

    if (lockedSupply > 0) {
      nextSlices.push({ label: 'Non-circulating', value: lockedSupply, color: '#38bdf8' });
    }

    return { slices: nextSlices, totalSupply: snapshot.totalSupply };
  }, [snapshot]);

  let currentAngle = 0;

  return (
    <section className="py-12">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-black mb-4 text-blue-700 text-center">Token Supply Breakdown</h2>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="flex flex-col items-center">
              {loading ? (
                <div className="flex h-[260px] w-[260px] items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80">
                  Loading chart...
                </div>
              ) : error ? (
                <div className="flex h-[260px] w-[260px] items-center justify-center rounded-3xl border border-red-200/30 bg-red-500/10 px-6 text-center text-red-100">
                  {error}
                </div>
              ) : (
                <svg viewBox="0 0 240 240" className="h-[260px] w-[260px] drop-shadow-2xl">
                  <circle cx="120" cy="120" r="94" fill="rgba(255,255,255,0.08)" />
                  {slices.map((slice) => {
                    const angle = totalSupply > 0 ? (slice.value / totalSupply) * 360 : 0;
                    const path = describeArc(120, 120, 94, currentAngle, currentAngle + angle);
                    currentAngle += angle;
                    return <path key={slice.label} d={path} fill={slice.color} stroke="rgba(15,23,42,0.25)" strokeWidth="2" />;
                  })}
                  <circle cx="120" cy="120" r="52" fill="#0f172a" fillOpacity="0.9" />
                  <text x="120" y="110" textAnchor="middle" className="fill-white text-[10px] uppercase tracking-[0.28em]">Total Supply</text>
                  <text x="120" y="136" textAnchor="middle" className="fill-white text-[16px] font-bold">{formatWhole(totalSupply)}</text>
                </svg>
              )}
            </div>

            <div>
              <div className="mb-5 text-center lg:text-left">
                <div className="text-sm uppercase tracking-[0.3em] text-white/65">Live Token Stats</div>
                <h3 className="mt-2 text-3xl font-black text-white">How EPWX supply is distributed</h3>
                <p className="mt-3 text-sm leading-7 text-white/80">
                  This chart uses the live total, circulating, and burned supply endpoints. Any remaining balance is shown as non-circulating supply.
                </p>
              </div>

              <div className="grid gap-3">
                {slices.map((slice) => {
                  const percentage = totalSupply > 0 ? (slice.value / totalSupply) * 100 : 0;
                  return (
                    <div key={slice.label} className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">{slice.label}</span>
                        </div>
                        <span className="text-sm font-bold text-white/85">{percentage.toFixed(2)}%</span>
                      </div>
                      <div className="mt-2 text-2xl font-black text-white">{formatWhole(slice.value)} EPWX</div>
                    </div>
                  );
                })}
              </div>

              {!loading && !error ? (
                <div className="mt-4 space-y-3">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                    Auto-refreshes every 24 hours
                  </div>
                  <a
                    href="https://basescan.org/token/0xef5f5751cf3eca6cc3572768298b7783d33d60eb?a=0x000000000000000000000000000000000000dead#transactions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-sm font-semibold text-white underline decoration-white/50 underline-offset-4 transition hover:text-slate-200"
                  >
                    View burned supply in the dead address on Basescan
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}