'use client';

import { Header } from "@/components/Header";
import { CompletedTasks } from "@/components/CompletedTasks";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { EPWXCashbackClaim } from "@/components/EPWXCashbackClaim";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-8">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          My Dashboard
        </h1>

        {/* Twitter Connection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">X Account</h2>
        </div>

        {/* Action Buttons removed */}

        {/* EPWX Cashback Claim */}
        <EPWXCashbackClaim />

        {/* Recent Activity */}
        <CompletedTasks />
      </main>
    </div>
  );
}
