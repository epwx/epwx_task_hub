"use client";
import Link from "next/link";
import { Header } from "@/components/Header";
import { EPWXStats } from "@/components/EPWXStats";
import { EPWXCashbackClaim } from "@/components/EPWXCashbackClaim";
import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import toast from "react-hot-toast";
import { ConnectKitButton } from "connectkit";

export default function HomeTest() {
  const { address, isConnected } = useAccount();
  const referralLink = address ? `https://t.me/epwx_bot?start=${address}` : '';
  const [referralCount, setReferralCount] = useState<number | null>(null);
  useEffect(() => {
    if (!address) {
      setReferralCount(null);
      return;
    }
    fetch(`/api/epwx/telegram-referral-stats?wallet=${address}`)
      .then(res => res.json())
      .then(data => setReferralCount(typeof data.count === 'number' ? data.count : 0))
      .catch(() => setReferralCount(null));
  }, [address]);

  const [specialEligible, setSpecialEligible] = useState(false);
  const [specialClaiming, setSpecialClaiming] = useState(false);
  const [specialClaimStatus, setSpecialClaimStatus] = useState<string | null>(null);
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

  const [copied, setCopied] = useState(false);
  const handleCopyReferral = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { signMessageAsync } = useSignMessage();
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isTelegramVerified, setIsTelegramVerified] = useState<boolean>(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
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
          <div className="flex flex-col items-center justify-center gap-4 p-6 bg-white rounded-xl shadow mb-6 w-full max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-2 text-center w-full">Wallet & Telegram Verification</h2>
            {!address ? (
              <div className="flex flex-col items-center w-full">
                <span className="mb-2 text-gray-700 text-center">Please connect your wallet to access all features.</span>
                <ConnectKitButton />
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="mb-2 w-full flex flex-col items-center">
                  <span className="text-gray-700 font-medium text-center break-all w-full">
                    Connected wallet:
                    <span className="block text-xs text-gray-500 font-mono bg-gray-100 rounded px-2 py-1 mt-1 w-full overflow-x-auto" style={{wordBreak: 'break-all'}}>{address}</span>
                  </span>
                </div>
                {checkingVerification ? (
                  <span className="text-gray-500">Checking Telegram verification...</span>
                ) : isTelegramVerified ? (
                  <span className="bg-green-100 text-green-700 font-bold py-2 px-4 rounded-lg mb-2 w-full text-center block">✅ Telegram membership verified</span>
                ) : (
                  <a
                    href={`https://t.me/epwx_bot?start=${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg mb-2 w-full text-center"
                  >Verify Telegram Membership</a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Referral Section */}
        <section className="my-8">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2 text-center w-full">Your Referral Link</h2>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xl mb-4">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-700 font-mono text-xs"
              />
              <button
                onClick={handleCopyReferral}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
              >{copied ? "Copied!" : "Copy Link"}</button>
              <button
                onClick={() => {
                  if (navigator.share && referralLink) {
                    navigator.share({
                      title: 'Join EPWX on Telegram!',
                      text: 'Join me on EPWX and earn rewards. Use my referral link:',
                      url: referralLink,
                    });
                  } else {
                    handleCopyReferral();
                    toast('Referral link copied! Share it anywhere.');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
              >Share Link</button>
            </div>
            <div className="text-lg text-gray-700 text-center">
              {referralCount === null ? 'Loading your referral stats...' : `Successful Referrals: ${referralCount}`}
            </div>
          </div>
        </section>

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

        {/* Daily Claim Section */}
        <section className="py-12">
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Daily Claim</h2>
            {address ? (
              isTelegramVerified ? (
                <>
                  <button
                    onClick={handleDailyClaim}
                    disabled={claiming}
                    className={`px-6 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 transition-colors mb-4 ${claiming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {claiming ? 'Claiming...' : 'Claim Daily Reward'}
                  </button>
                  {claimStatus && (
                    <div className="text-center text-lg font-semibold text-green-700 mb-2">{claimStatus}</div>
                  )}
                </>
              ) : (
                <div className="text-center text-red-600 font-semibold mb-2">Please verify your Telegram membership to claim daily rewards.</div>
              )
            ) : (
              <div className="text-center text-gray-600 font-semibold mb-2">Connect your wallet to claim daily rewards.</div>
            )}
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
            <a href="/user-guide" className="hover:text-blue-400 transition-colors">User Guide</a>
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
