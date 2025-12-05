'use client';

import Link from 'next/link';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';

export function Header() {
  const { address, isConnected } = useAccount();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">EPWX</span>
            <span className="text-xl text-gray-700">Tasks</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/tasks" className="text-gray-700 hover:text-blue-600 transition">
              Browse Tasks
            </Link>
            {isConnected && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition">
                  Dashboard
                </Link>
                <Link href="/advertise" className="text-gray-700 hover:text-blue-600 transition">
                  Create Campaign
                </Link>
              </>
            )}
            <a 
              href="https://epowex.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Main Site
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href={`https://pancakeswap.finance/swap?chain=base&outputCurrency=${process.env.NEXT_PUBLIC_EPWX_TOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
            >
              Buy EPWX
            </a>
            <ConnectKitButton />
          </div>
        </div>
      </div>
    </header>
  );
}
