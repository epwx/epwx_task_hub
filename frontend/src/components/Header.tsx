'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';


type HeaderProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Header({ darkMode, setDarkMode }: HeaderProps) {
  const { address, isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const env = process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
  const adminWallets = env.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
  const isAdmin = address && adminWallets.includes(address.toLowerCase());

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
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
          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className={pathname === "/" ? "font-bold text-blue-600" : ""}>Main Site</a>
            <a href="/referral" className={pathname === "/referral" ? "font-bold text-blue-600" : ""}>Referral</a>
            <a href="/platform-stats" className={pathname === "/platform-stats" ? "font-bold text-blue-600" : ""}>Platform Stats</a>
            <a href="/contact" className={pathname === "/contact" ? "font-bold text-blue-600" : ""}>Contact Us</a>
            <a
              href={`https://pancakeswap.finance/swap?chain=base&outputCurrency=${process.env.NEXT_PUBLIC_EPWX_TOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all shadow-md text-center"
            >
              💰 Buy EPWX
            </a>
            {isAdmin && (
              <>
                <a
                  href="/admin"
                  className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-xl hover:from-green-100 hover:to-green-200 transition-all shadow-md text-center"
                >
                  🛡️ Admin Dashboard
                </a>
                <a
                  href="/admin/merchants"
                  className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all shadow-md text-center"
                >
                  🏪 Merchant Admin
                </a>
              </>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href={`https://pancakeswap.finance/swap?chain=base&outputCurrency=${process.env.NEXT_PUBLIC_EPWX_TOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all shadow-md hover:shadow-lg hover:scale-105 border border-blue-200"
            >
              💰 Buy EPWX
            </a>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-50"></div>
              <div className="relative">
                <ConnectKitButton />
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '🌙 Dark' : '☀️ Light'}
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
              <Link href="/referral" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Referral</Link>
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
                href={`https://pancakeswap.finance/swap?chain=base&outputCurrency=${process.env.NEXT_PUBLIC_EPWX_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all shadow-md text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                💰 Buy EPWX
              </a>
              {/* Show Admin Dashboard link if admin wallet is connected */}
              {isAdmin ? (
                <>
                  <a
                    href="/admin"
                    className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-xl hover:from-green-100 hover:to-green-200 transition-all shadow-md text-center block mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🛡️ Admin Dashboard
                  </a>
                  <a
                    href="/admin/merchants"
                    className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all shadow-md text-center block mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🏪 Merchant Admin
                  </a>
                </>
              ) : null}
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
