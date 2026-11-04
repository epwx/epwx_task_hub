'use client';

import { useState } from 'react';

type WhitepaperAddressProps = {
  address: string;
  href?: string;
  compact?: boolean;
};

function truncateAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function WhitepaperAddress({ address, href, compact = false }: WhitepaperAddressProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }

    window.setTimeout(() => setCopyStatus('idle'), 1600);
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 font-mono text-xs font-medium text-slate-700 transition-colors hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300"
          title={`View ${address} on BaseScan`}
        >
          <span className={compact ? '' : 'sm:hidden'}>{truncateAddress(address)}</span>
          {!compact ? <span className="hidden break-all sm:inline">{address}</span> : null}
        </a>
      ) : (
        <span className="min-w-0 font-mono text-xs font-medium text-slate-700 dark:text-slate-200">
          <span className={compact ? '' : 'sm:hidden'}>{truncateAddress(address)}</span>
          {!compact ? <span className="hidden break-all sm:inline">{address}</span> : null}
        </span>
      )}
      <button
        type="button"
        onClick={copyAddress}
        className="shrink-0 border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-colors hover:border-sky-400 hover:text-sky-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-sky-500 dark:hover:text-sky-300"
        aria-label={`Copy address ${address}`}
      >
        {copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Retry' : 'Copy'}
      </button>
    </div>
  );
}
