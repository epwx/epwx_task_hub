"use client";
import React from "react";
import Header from "@/components/Header";

export default function UserGuide() {
  return (
    <>

      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">EPWX Task Platform User Guide</h1>
        <ol className="list-decimal pl-6 space-y-6 text-lg">
          <li>
            <strong>Connecting Your Wallet:</strong>
            <ul className="list-disc pl-6">
              <li>Click the <b>Connect Wallet</b> button at the top of the page.</li>
              <li>Follow the prompts to connect your preferred wallet (e.g., MetaMask, WalletConnect).</li>
              <li>Once connected, your wallet address will be displayed.</li>
            </ul>
          </li>
          <li>
            <strong>Telegram Membership Verification:</strong>
            <ul className="list-disc pl-6">
              <li>To access all features, you must verify your Telegram group membership.</li>
              <li>If not verified, click the <b>Verify Telegram Membership</b> button. This will redirect you to Telegram to complete verification.</li>
              <li>Once verified, you’ll see a green badge: “✅ Telegram membership verified.”</li>
            </ul>
          </li>
          <li>
            <strong>Special Claim:</strong>
            <ul className="list-disc pl-6">
              <li>If you are eligible, you will see a <b>Special Claim</b> card on the homepage.</li>
              <li>Click <b>Claim Special 1,000,000 EPWX</b> to submit your claim.</li>
              <li>You will receive a status message. If successful, your claim will be processed and is subject to admin approval.</li>
              <li>You can check your claim status in the admin panel if you have access.</li>
            </ul>
          </li>
          <li>
            <strong>Daily Claim:</strong>
            <ul className="list-disc pl-6">
              <li>After verifying your Telegram membership, you can claim a daily reward from the homepage.</li>
              <li>Click <b>Claim Daily Reward</b> in the Daily Claim section.</li>
              <li>You will receive a status message about your claim.</li>
              <li>You can claim once per day, and the reward is 100,000 EPWX.</li>
            </ul>
          </li>
          <li>
            <strong>Referrals:</strong>
            <ul className="list-disc pl-6">
              <li>Share your referral link from the homepage to invite new users.</li>
              <li>Successful referrals will be tracked and displayed in your referral stats.</li>
              <li>Referral rewards are distributed after verification.</li>
            </ul>
          </li>
          <li>
            <strong>Platform Stats:</strong>
            <ul className="list-disc pl-6">
              <li>The <b>Platform Stats</b> section shows real-time statistics about the EPWX ecosystem, such as total tokens distributed and active campaigns.</li>
            </ul>
          </li>
          <li>
            <strong>Cashback Rewards:</strong>
            <ul className="list-disc pl-6">
              <li>The <b>Cashback Rewards</b> section allows you to claim cashback for eligible activities.</li>
              <li>Follow the on-screen instructions to claim your rewards.</li>
            </ul>
          </li>
          <li>
            <strong>Footer Links:</strong>
            <ul className="list-disc pl-6">
              <li>Access the main site, Terms of Service, Privacy Policy, and Twitter from the footer.</li>
            </ul>
          </li>
        </ol>
        <div className="mt-10 text-base text-gray-600">
          <b>Tips:</b>
          <ul className="list-disc pl-6 mt-2">
            <li>Make sure your wallet is connected and Telegram is verified for full access.</li>
            <li>If you encounter issues, refresh the page or reconnect your wallet.</li>
            <li>For support, join the official Telegram group or contact support via the main site.</li>
          </ul>
        </div>
        <p className="mt-8 text-center text-indigo-700 font-semibold">Enjoy earning with EPWX Task Platform!</p>
      </div>
    </>
  );
}
