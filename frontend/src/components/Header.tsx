'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';


type HeaderProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Header({ darkMode, setDarkMode }: HeaderProps) {
  const { address, isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();


  // Admin wallets
  const env = process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
  const adminWallets = env.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
  const [merchantWallets, setMerchantWallets] = useState<string[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(false);

  // Fetch merchant wallets on mount (public endpoint)
  useEffect(() => {
    async function fetchMerchantWallets() {
      setLoadingMerchants(true);
      try {
        const res = await fetch(`/api/merchants/wallets`);
        const data = await res.json();
        if (data.wallets) {
          setMerchantWallets(data.wallets);
        }
      } catch {}
      setLoadingMerchants(false);
    }
    fetchMerchantWallets();
  }, []);

  const isAdmin = address && adminWallets.includes(address.toLowerCase());
  const isMerchant = address && merchantWallets.includes(address.toLowerCase());
  const isHomePage = pathname === '/';
  const desktopLinks = [
    {
      href: '/',
      label: 'Home',
      external: false,
      active: pathname === '/',
    },
    {
      href: 'https://epowex.com',
      label: 'Main Site',
      external: true,
      active: false,
    },
    {
      href: '/whitepaper',
      label: 'Whitepaper',
      external: false,
      active: pathname === '/whitepaper',
    },
    {
      href: '/platform-stats',
      label: 'Platform Stats',
      external: false,
      active: pathname === '/platform-stats',
    },
    {
      href: '/blog',
      label: 'Blog',
      external: false,
      active: pathname === '/blog',
    },
    {
      href: 'https://t.me/ePowerX_On_Base',
      label: 'Contact Us',
      external: true,
      active: false,
    },
  ];
  const dashboardLinks = isAdmin
    ? [
        { href: '/admin', label: 'Admin Dashboard', active: pathname === '/admin' },
        { href: '/admin/daily-draws', label: 'Daily Draws', active: pathname === '/admin/daily-draws' },
        { href: '/admin/merchants', label: 'Merchant Admin', active: pathname === '/admin/merchants' },
        { href: '/admin/partners', label: 'Partner Verification', active: pathname === '/admin/partners' },
        { href: '/admin/telegram-group-rewards', label: 'Telegram Group Rewards', active: pathname === '/admin/telegram-group-rewards' },
        { href: '/admin/reward-ledger', label: 'Reward Ledger', active: pathname === '/admin/reward-ledger' },
      ]
    : isMerchant
      ? [{ href: '/admin/reward-ledger', label: 'Reward Ledger', active: pathname === '/admin/reward-ledger' }]
      : isConnected
        ? [{ href: '/partner', label: 'Partner Portal', active: pathname === '/partner' }]
        : [];
  const desktopNavLinkClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold tracking-[0.01em] transition-all ${
      active
        ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;
  const desktopActionClass =
    'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:text-white';
  const desktopActionLinkClass = (active: boolean) =>
    active
      ? 'rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all dark:border-white dark:bg-white dark:text-slate-950'
      : desktopActionClass;
  const mobileNavLinkClass = (active: boolean) =>
    `rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
      active
        ? 'border-emerald-300/35 bg-emerald-400/15 text-emerald-50'
        : 'border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]'
    }`;
  const mobileActionLinkClass = (active: boolean) =>
    `rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
      active
        ? 'border-cyan-300/35 bg-cyan-400/15 text-cyan-50'
        : 'border-white/10 bg-slate-950/50 text-white hover:bg-white/[0.08]'
    }`;
  const buyLinkClass =
    isHomePage
      ? 'rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100'
      : desktopActionClass;

  // Debug logs for troubleshooting
  useEffect(() => {
    if (address) {
      console.log('[DEBUG] Connected address:', address.toLowerCase());
      console.log('[DEBUG] Merchant wallets:', merchantWallets);
      console.log('[DEBUG] isMerchant:', isMerchant);
    }
  }, [address, merchantWallets, isMerchant]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/88 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image 
              src="/logo.webp" 
              alt="EPWX Tasks" 
              width={150} 
              height={40}
              className="h-10 w-auto transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-3">
            <nav className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              {desktopLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={desktopNavLinkClass(link.active)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} href={link.href} className={desktopNavLinkClass(link.active)}>
                    {link.label}
                  </Link>
                )
              )}
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/#buy-epwx" className={buyLinkClass}>
                Buy EPWX
              </Link>
              {dashboardLinks.map((link) => (
                <Link key={link.href} href={link.href} className={desktopActionLinkClass(link.active)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-slate-400/40 to-slate-700/30 blur"></div>
              <div className="relative">
                <ConnectKitButton />
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? 'Dark' : 'Light'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg bg-slate-900/60 p-2 text-white transition-colors hover:bg-slate-800/80 dark:bg-slate-900/60 dark:text-white dark:hover:bg-slate-800/80"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 animate-fadeIn">
            <div className="ui-surface-strong max-h-[calc(100dvh-8rem)] overflow-x-hidden overflow-y-auto overscroll-contain p-4 text-white shadow-[0_20px_45px_rgba(2,6,23,0.45)] [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
              <nav className="relative space-y-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Navigation</div>
                  <div className="mt-3 grid gap-2">
                    {desktopLinks.map((link) =>
                      link.external ? (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={mobileNavLinkClass(link.active)}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={link.label}
                          href={link.href}
                          className={mobileNavLinkClass(link.active)}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Quick Actions</div>
                  <div className="mt-3 grid gap-2">
                    <Link
                      href="/#buy-epwx"
                      className="rounded-2xl border border-emerald-300/35 bg-emerald-400/15 px-4 py-3 text-sm font-bold text-emerald-50 transition-colors hover:bg-emerald-400/25"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Buy EPWX
                    </Link>
                    {dashboardLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={mobileActionLinkClass(link.active)}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-slate-300">
                    <div className="font-black uppercase tracking-[0.2em] text-slate-400">Wallet Status</div>
                    <div className="mt-2 text-sm font-semibold text-white">{isConnected ? 'Connected' : 'Not connected'}</div>
                    <div className="mt-1 break-all text-xs text-slate-400">{address || 'Connect a wallet to access rewards and partner tools.'}</div>
                  </div>
                  <button
                    onClick={() => {
                      setDarkMode(!darkMode);
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-100 transition-colors hover:bg-white/[0.08]"
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                  <ConnectKitButton key={pathname} />
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
