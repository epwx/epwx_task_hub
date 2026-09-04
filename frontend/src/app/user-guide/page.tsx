"use client";
import React from "react";
import Footer from "@/components/Footer";

export default function UserGuide() {
  return (
    <>

      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:py-14">
        <main className="mx-auto max-w-4xl">
          <div className="ui-surface-strong p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] sm:p-10">
        <p className="text-center text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Getting started</p>
        <h1 className="mt-3 mb-8 text-center text-3xl font-black text-white sm:text-4xl">EPWX Task Platform User Guide</h1>
        <ol className="list-decimal space-y-6 pl-6 text-base leading-7 text-slate-300 sm:text-lg">
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
                <li>You can claim once per day. Wallets with at least <b>1,000,000,000,000 EPWX</b> can claim <b>10,000,000 EPWX</b>, wallets with at least <b>100,000,000,000 EPWX</b> can claim <b>5,000,000 EPWX</b>, wallets with at least <b>10,000,000,000 EPWX</b> can claim <b>2,000,000 EPWX</b>, and other wallets can claim <b>100,000 EPWX</b>.</li>
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
              <li>The <b>Cashback Rewards</b> section allows you to claim a fixed <b>1,000,000,000 EPWX</b> cashback reward for eligible purchases above <b>100,000,000,000 EPWX</b> made within the last 3 hours.</li>
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
        <div className="mt-10 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-5 text-base text-emerald-50">
          <b className="text-emerald-200">Tips:</b>
          <ul className="list-disc pl-6 mt-2">
            <li>Make sure your wallet is connected and Telegram is verified for full access.</li>
            <li>If you encounter issues, refresh the page or reconnect your wallet.</li>
          </ul>
        </div>
        <p className="mt-8 text-center font-semibold text-emerald-200">Enjoy earning with EPWX Task Platform!</p>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
