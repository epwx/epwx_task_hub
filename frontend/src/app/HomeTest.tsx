"use client";
import Link from "next/link";
import Header from "@/components/Header";
import { EPWXStats } from "@/components/EPWXStats";
import { EPWXCashbackClaim } from "@/components/EPWXCashbackClaim_clean";
import { useState, useEffect } from "react";
import DailyClaimsTable from "@/components/DailyClaimsTable";
import { useAccount, useSignMessage } from "wagmi";
import toast from "react-hot-toast";
import { ConnectKitButton } from "connectkit";

// Helper component to fetch and display user's daily claims
function UserDailyClaims({ address }: { address: string }) {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/epwx/daily-claims?wallet=${address}&status=pending`)
      .then(res => res.json())
      .then(data => setClaims(Array.isArray(data.claims) ? data.claims : []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, [address]);
  if (loading) return <div className="text-center text-gray-500">Loading daily claims...</div>;
  if (!claims.length) return <div className="text-center text-gray-600">No daily claims found.</div>;
  return <DailyClaimsTable claims={claims} isAdmin={false} />;
}

// Helper component to fetch and display user's last 5 paid daily claims (all wallets)
function LastFivePaidDailyClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/epwx/daily-claims?status=paid&limit=5`)
      .then(res => res.json())
      .then(data => setClaims(Array.isArray(data.claims) ? data.claims : []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-center text-gray-500">Loading daily claims...</div>;
  if (!claims.length) return <div className="text-center text-gray-600">No paid daily claims found.</div>;
  return <DailyClaimsTable claims={claims} isAdmin={false} />;
}

export default function HomeTest() {
  const { address, isConnected } = useAccount();

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

  const { signMessageAsync } = useSignMessage();
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isTelegramVerified, setIsTelegramVerified] = useState<boolean>(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const checkVerification = async () => {
      if (!address) {
        setIsTelegramVerified(false);
        return;
      }
      setCheckingVerification(true);
      try {
        const res = await fetch(`${API_URL}/api/epwx/telegram-verified?wallet=${address}`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:bg-gray-950 dark:bg-none flex flex-col">
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

        {/* Special EPWX Claim Section */}
        {address && isTelegramVerified && specialEligible && (
          <section className="py-12">
            <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center w-full max-w-lg mx-auto border-2 border-yellow-400">
              <h2 className="text-2xl font-bold mb-4 text-yellow-700">Special Claim</h2>
              <p className="mb-4 text-gray-700 text-center">You are eligible for a <b>Special 1,000,000 EPWX</b> reward!</p>
              <button
                onClick={handleSpecialClaim}
                disabled={specialClaiming}
                className={`px-6 py-3 rounded-lg font-bold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors mb-4 ${specialClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {specialClaiming ? 'Claiming...' : 'Claim Special 1,000,000 EPWX'}
              </button>
              {specialClaimStatus && (
                <div className="text-center text-lg font-semibold text-yellow-700 mb-2">{specialClaimStatus}</div>
              )}
            </div>
          </section>
        )}

        {/* Daily Claim Section */}
        <section className="py-12">
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center w-full max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Daily Claim</h2>
            {address ? (
              isTelegramVerified ? (
                <>
                  <div className="flex items-center mb-4">
                    <input
                      id="daily-terms-checkbox"
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="daily-terms-checkbox" className="text-sm text-gray-700">
                      I agree to the{' '}
                      <button
                        type="button"
                        className="text-blue-600 underline hover:text-blue-800"
                        onClick={() => setShowTerms(true)}
                      >
                        terms and conditions
                      </button>
                    </label>
                  </div>
                  <button
                    onClick={handleDailyClaim}
                    disabled={claiming || !agreed}
                    className={`px-6 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 transition-colors mb-4 ${claiming || !agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {claiming ? 'Claiming...' : 'Claim Daily Reward'}
                  </button>
                  {showTerms && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                        <button
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                          onClick={() => setShowTerms(false)}
                          aria-label="Close"
                        >
                          &times;
                        </button>
                        <div className="prose max-w-none text-gray-900 dark:text-gray-100">
                          <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
                          <p className="mb-4">Welcome to EPWX Task Hub. By accessing or using our platform, you agree to these Terms and Conditions. Please read them carefully.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
                          <p className="mb-4">By using EPWX Task Hub, you agree to comply with these Terms and all applicable laws. If you do not agree, do not use the platform.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">2. User Responsibilities</h2>
                          <ul className="list-disc pl-6 mb-4">
                            <li>Provide accurate, complete, and current information during registration and task submissions.</li>
                            <li>Do not engage in fraudulent, abusive, or illegal activities.</li>
                            <li>Respect other users, platform administrators, and all applicable laws.</li>
                            <li>Maintain the confidentiality of your account credentials and notify us immediately of any unauthorized use.</li>
                          </ul>
                          <h2 className="text-lg font-semibold mt-6 mb-2">3. Prohibited Conduct</h2>
                          <ul className="list-disc pl-6 mb-4">
                            <li>No use of bots, scripts, or automated methods to access or use the platform.</li>
                            <li>No uploading of viruses, malware, or harmful code.</li>
                            <li>No attempts to disrupt, damage, or gain unauthorized access to the platform or other users’ accounts.</li>
                          </ul>
                          <h2 className="text-lg font-semibold mt-6 mb-2">4. Platform Rights</h2>
                          <ul className="list-disc pl-6 mb-4">
                            <li>We may modify, suspend, or terminate the platform or your access at any time, for any reason, without notice.</li>
                            <li>We may change these Terms at any time. Continued use constitutes acceptance of the revised Terms.</li>
                            <li>We reserve all rights not expressly granted to you.</li>
                          </ul>
                          <h2 className="text-lg font-semibold mt-6 mb-2">5. Intellectual Property</h2>
                          <p className="mb-4">All content, trademarks, and data on EPWX Task Hub are the property of their respective owners. You may not copy, modify, or distribute any content without permission.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">6. Limitation of Liability</h2>
                          <p className="mb-4">EPWX Task Hub is provided “as is” and “as available.” We disclaim all warranties, express or implied. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">7. Indemnification</h2>
                          <p className="mb-4">You agree to indemnify and hold harmless EPWX Task Hub, its affiliates, and staff from any claims, damages, or expenses arising from your use of the platform or violation of these Terms.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">8. Privacy</h2>
                          <p className="mb-4">We respect your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">9. Governing Law</h2>
                          <p className="mb-4">These Terms are governed by the laws of the jurisdiction in which EPWX Task Hub operates.</p>
                          <h2 className="text-lg font-semibold mt-6 mb-2">10. Contact</h2>
                          <p>If you have questions about these Terms, please contact info@epowex.com.</p>
                        </div>
                      </div>
                    </div>
                  )}
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

        {/* Cashback Rewards Section */}
        <section className="py-12">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700 text-center">Cashback Rewards</h2>
            <div className="bg-white rounded-xl shadow p-8 w-full max-w-xl">
              <EPWXCashbackClaim />
            </div>
          </div>
        </section>

        {/* User Daily Claims Table Section */}
        {address && (
          <section className="py-12">
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">Your Daily Pending Claims</h2>
              <div className="bg-white rounded-xl shadow p-8 w-full max-w-xl">
                <UserDailyClaims address={address} />
              </div>
            </div>
          </section>
        )}

        {/* Last 5 Paid Daily Claims Section */}
        <section className="py-12">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">Last 5 Paid Daily Claims (All Wallets)</h2>
            <div className="bg-white rounded-xl shadow p-8 w-full max-w-xl">
              <LastFivePaidDailyClaims />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 mt-20 dark:bg-gray-950 dark:bg-none">
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
