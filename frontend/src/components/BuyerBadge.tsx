export interface BuyerBadge {
  variant: 'whale' | 'tier' | 'buyer';
  label: string;
  accentClassName: string;
  description: string;
  benefit: string;
}

function BuyerBadgeIcon({ variant }: { variant: BuyerBadge['variant'] }) {
  if (variant === 'whale') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M4 18h16v2H4v-2Zm1.2-10.4 3.55 2.42L12 4.5l3.25 5.52 3.55-2.42-1.68 7.4H6.88L5.2 7.6Z" />
      </svg>
    );
  }

  if (variant === 'tier') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M12 2 5 5v6c0 4.65 2.98 8.99 7 10 4.02-1.01 7-5.35 7-10V5l-7-3Zm0 4.2 3.5 1.5V11c0 2.7-1.5 5.25-3.5 6.55C10 16.25 8.5 13.7 8.5 11V7.7L12 6.2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 3.5 14.63 8.83l5.87.85-4.25 4.14 1 5.85L12 16.9l-5.25 2.77 1-5.85L3.5 9.68l5.87-.85L12 3.5Z" />
    </svg>
  );
}

export function BuyerBadgeChip({ badge, compact = false }: { badge: BuyerBadge; compact?: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border font-black uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm',
        compact ? 'px-3 py-1.5 text-[11px] tracking-[0.18em]' : 'px-3.5 py-2 text-xs tracking-[0.16em]',
        badge.accentClassName,
      ].join(' ')}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 ring-1 ring-white/15">
        <BuyerBadgeIcon variant={badge.variant} />
      </span>
      <span>{badge.label}</span>
    </span>
  );
}
