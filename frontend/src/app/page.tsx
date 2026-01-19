"use client";
import Link from "next/link";
import { Header } from "@/components/Header";
import { EPWXStats } from "@/components/EPWXStats";
import { EPWXCashbackClaim } from "@/components/EPWXCashbackClaim";
import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import toast from "react-hot-toast";
import { ConnectKitButton } from "connectkit";

export default function Home() {
    const { address, isConnected } = useAccount();
    // Special Claim State
    const [specialEligible, setSpecialEligible] = useState(false);
    const [specialClaiming, setSpecialClaiming] = useState(false);
    const [specialClaimStatus, setSpecialClaimStatus] = useState<string | null>(null);

    // Check special claim eligibility
    useEffect(() => {
      const checkSpecialClaim = async () => {
        if (!address) {
          setSpecialEligible(false);
          return;
        }
        try {
          const res = await fetch(`/api/epwx/special-claim/status?wallet=${address}`);
          const data = await res.json();
          setSpecialEligible(!!data.eligible);
        } catch (e) {
          setSpecialEligible(false);
        }
      };
      checkSpecialClaim();
    }, [address]);

    // Handle special claim
    const handleSpecialClaim = async () => {
      setSpecialClaiming(true);
      setSpecialClaimStatus(null);
      try {
        const res = await fetch("/api/epwx/special-claim/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: address }),
        });
        const data = await res.json();
        if (data.success) {
          setSpecialClaimStatus("Special claim submitted. Pending admin approval.");
          setSpecialEligible(false);
          toast.success("Special claim submitted! Pending admin approval.");
        } else {
          setSpecialClaimStatus(data.error || "Special claim failed");
          toast.error(data.error || "Special claim failed");
        }
      } catch (e) {
        setSpecialClaimStatus("Special claim failed");
        toast.error("Special claim failed");
      }
      setSpecialClaiming(false);
    };
  // ...existing code...
  const { signMessageAsync } = useSignMessage();
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  // Removed Telegram modal state
  const [isTelegramVerified, setIsTelegramVerified] = useState<boolean>(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check Telegram verification status when address changes
  useEffect(() => {
    const checkVerification = async () => {
      if (!address) {
        setIsTelegramVerified(false);
        return;
      }
      setCheckingVerification(true);
      try {
        const res = await fetch(`https://api.epowex.com/api/epwx/telegram-verified?wallet=${address}`);
        const data = await res.json();
        setIsTelegramVerified(!!data.verified);
      } catch (e) {
        setIsTelegramVerified(false);
      }
      setCheckingVerification(false);
    };
    checkVerification();
  }, [address]);

  // Removed Telegram modal effect

  const handleDailyClaim = async () => {
    setClaiming(true);
    setClaimStatus(null);
    try {
      const todayUtc = new Date(Date.now()).toISOString().slice(0, 10);
      const message = `EPWX Daily Claim for ${address} on ${todayUtc}`;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        <Header />
        <main className="container mx-auto px-4 flex-1">
          {/* Wallet Connection & Verification Section */}
          <section className="my-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white rounded-xl shadow mb-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Wallet & Telegram Verification</h2>
                {!address ? (
                  <div className="flex flex-col items-start">
                    <span className="mb-2 text-gray-700">Please connect your wallet to access all features.</span>
                    <ConnectKitButton />
                  </div>
                ) : (
                  <div className="flex flex-col items-start">
                    <span className="mb-2 text-gray-700">Connected wallet: {address}</span>
                    {checkingVerification ? (
                      <span className="text-gray-500">Checking Telegram verification...</span>
                    ) : isTelegramVerified ? (
                      <span className="bg-green-100 text-green-700 font-bold py-2 px-4 rounded-lg mb-2">✅ Telegram membership verified</span>
                    ) : (
                      <a
                        href={`https://t.me/epwx_bot?start=${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg mb-2"
                      >
                        Verify Telegram Membership
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Hero Section */}
          <section className="py-12 text-center relative mb-8">
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
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Special Claim Card */}
            {address && specialEligible && (
              <section className="bg-purple-50 rounded-xl shadow p-8 flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4 text-purple-700">Special Claim</h2>
                <button
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-purple-700 transition-all disabled:opacity-60"
                  onClick={handleSpecialClaim}
                  disabled={specialClaiming}
                >
                  {specialClaiming ? "Claiming..." : "Claim Special 1,000,000 EPWX"}
                </button>
                {specialClaimStatus && (
                  <div className={`mt-2 text-center ${specialClaimStatus.startsWith("Successfully") ? "text-green-700" : "text-red-600"}`}>{specialClaimStatus}</div>
                )}
              </section>
            )}

            {/* Daily Claim Card */}
            {address && (
              <section className="bg-green-50 rounded-xl shadow p-8 flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4 text-green-700">Daily Claim</h2>
                {isTelegramVerified ? (
                  <>
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
                  </>
                ) : (
                  <div className="text-red-600 font-semibold">You must verify your Telegram group membership to claim daily rewards.</div>
                )}
              </section>
            )}
          </div>

          {/* Stats Section */}
          <section className="py-12">
            <div className="bg-white rounded-xl shadow p-8">
              <h2 className="text-2xl font-bold mb-4 text-blue-700">Platform Stats</h2>
              <EPWXStats />
            </div>
          </section>

          {/* Cashback Rewards Section */}
          <section className="py-12">
            <div className="bg-white rounded-xl shadow p-8">
              <h2 className="text-2xl font-bold mb-4 text-indigo-700">Cashback Rewards</h2>
              <EPWXCashbackClaim />
            </div>
          </section>
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
