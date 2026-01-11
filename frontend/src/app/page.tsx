"use client";
import Link from "next/link";
import { Header } from "@/components/Header";
import { EPWXStats } from "@/components/EPWXStats";
import { EPWXCashbackClaim } from "@/components/EPWXCashbackClaim";
import { useAccount, useSignMessage } from "wagmi";
import { useState } from "react";

  const { address } = useAccount();
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const { signMessageAsync } = useSignMessage();

  const handleDailyClaim = async () => {
    setClaiming(true);
    setClaimStatus(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const message = `EPWX Daily Claim for ${address} on ${today}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/epwx/daily-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, signature }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimStatus("Successfully claimed 100,000 EPWX! Your reward will be sent soon.");
      } else {
        setClaimStatus(data.error || "Claim failed");
      }
    } catch (e) {
      setClaimStatus("Claim failed");
    }
    setClaiming(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          </div>
          <div className="relative z-10">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              🚀 Powered by Base Network
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Earn EPWX Tokens
              <span className="block mt-2">Complete Campaigns</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join the EPWX ecosystem on Base network. Complete campaigns and get rewarded with EPWX tokens instantly.
            </p>
            {/* Daily Claim Button */}
            {address && (
              <div className="mb-6 flex flex-col items-center justify-center">
                <button
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-green-700 transition-all disabled:opacity-60"
                  onClick={handleDailyClaim}
                  disabled={claiming}
                >
                  {claiming ? "Claiming..." : "Claim Daily 100,000 EPWX"}
                </button>
                {claimStatus && (
                  <div className={`mt-2 text-center ${claimStatus.startsWith("Successfully") ? "text-green-700" : "text-red-600"}`}>{claimStatus}</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12">
          <EPWXStats />
        </section>

        {/* Cashback Rewards Section */}
        <section className="py-12">
          <EPWXCashbackClaim />
        </section>

        {/* Featured Campaigns section removed */}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">EPWX Task Platform</h3>
            <p className="text-gray-400">Earn tokens by completing campaigns on Base Network</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-6">
            <a href="https://epowex.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Main Site</a>
            <span className="hidden md:block text-gray-600">•</span>
            <a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a>
            <span className="hidden md:block text-gray-600">•</span>
            <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <span className="hidden md:block text-gray-600">•</span>
            <a href="https://twitter.com/epowex" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Twitter</a>
          </div>
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; 2025 EPWX Task Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
