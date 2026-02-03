"use client";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ReferralPage() {
  const { address } = useAccount();
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
  const [copied, setCopied] = useState(false);
  const handleCopyReferral = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Referral Link</h1>
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xl mb-4 mx-auto">
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
  );
}
