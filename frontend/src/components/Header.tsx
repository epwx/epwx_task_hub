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
      href: 'https://t.me/ePowerX_On_Base',
      label: 'Contact Us',
      external: true,
      active: false,
    },
  ];
  const dashboardLinks = isAdmin
    ? [
        { href: '/admin', label: 'Admin Dashboard', active: pathname === '/admin' },
        { href: '/admin/merchants', label: 'Merchant Admin', active: pathname === '/admin/merchants' },
        { href: '/admin/twitter-claims', label: 'Engagement Claims', active: pathname === '/admin/twitter-claims' },
        { href: '/admin/reward-ledger', label: 'Reward Ledger', active: pathname === '/admin/reward-ledger' },
      ]
    : isMerchant
      ? [{ href: '/admin/reward-ledger', label: 'Reward Ledger', active: pathname === '/admin/reward-ledger' }]
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
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-900 dark:text-gray-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" className="dark:stroke-gray-200" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" className="dark:stroke-gray-200" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200 animate-fadeIn">
            <nav className="flex flex-col gap-4">
              <a 
                href="https://epowex.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Main Site
              </a>
              <Link href="/whitepaper" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Whitepaper</Link>
              <Link href="/platform-stats" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Platform Stats</Link>
              <a
                href="https://t.me/ePowerX_On_Base"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </a>
              <a
                href="/#buy-epwx"
                className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all shadow-md text-center block"
                onClick={() => setMobileMenuOpen(false)}
              >
                💰 Buy EPWX
              </a>
              {dashboardLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mt-2 block rounded-xl px-5 py-2.5 text-center text-sm font-bold shadow-sm transition-colors ${
                    link.active
                      ? 'border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setDarkMode(!darkMode);
                  setMobileMenuOpen(false);
                }}
                className="mt-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? '🌙 Dark' : '☀️ Light'}
              </button>
              <div className="pt-2">
                {/* Debug info: show wallet address and connection status */}
                <div className="text-xs text-gray-500 mb-2">
                  <div>Wallet: {address ? address : 'Not connected'}</div>
                  <div>Status: {isConnected ? 'Connected' : 'Not connected'}</div>
                </div>
                {/* Force ConnectKitButton to re-render on route change to fix wallet state sync */}
                <ConnectKitButton key={pathname} />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
