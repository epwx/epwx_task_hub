"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import PartnerRegistrationForm from "@/components/PartnerRegistrationForm";
import PartnerDashboard from "@/components/PartnerDashboard";
import toast from "react-hot-toast";

interface Partner {
  id: string;
  name: string;
  walletAddress: string;
  status: string;
  totalEarnings: string;
  totalReferredUsers: number;
  createdAt: string;
  rejectionReason?: string;
}

export default function PartnerPage() {
  const { address, isConnected } = useAccount();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"register" | "dashboard">("register");

  const getAppliedOnDate = (createdAt?: string) => {
    if (!createdAt) return "-";
    const parsedDate = new Date(createdAt);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    return parsedDate.toLocaleDateString();
  };

  // Check if wallet has a partner registered
  useEffect(() => {
    if (!isConnected || !address) {
      setPartner(null);
      return;
    }

    const checkPartner = async () => {
      try {
        setLoading(true);
        // Fetch all partners and check if this wallet is registered
        const res = await fetch(`/api/partners`);
        const data = await res.json();
        
        if (data.success && data.partners) {
          const found = data.partners.find(
            (p: Partner) => p.walletAddress.toLowerCase() === address.toLowerCase()
          );
          if (found) {
            setPartner(found);
            setActiveTab("dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking partner:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPartner();
  }, [address, isConnected]);

  const handleRegistrationSuccess = (newPartner: Partner) => {
    setPartner(newPartner);
    setActiveTab("dashboard");
    toast.success("Partner registered successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Wallet Connection Status */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Partner Portal</h2>
              <p className="mt-2 text-sm text-slate-400">
                {isConnected
                  ? `Connected: ${address?.substring(0, 6)}...${address?.substring(
                      address.length - 4
                    )}`
                  : "Please connect your wallet to continue"}
              </p>
            </div>
            <ConnectKitButton />
          </div>
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 p-12 text-center">
            <p className="text-lg font-semibold text-amber-100">
              Connect Your Wallet
            </p>
            <p className="mt-2 text-sm text-amber-200/80">
              You need to connect your wallet to access the partner portal
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
              <p className="text-slate-400">Loading...</p>
            </div>
          </div>
        ) : partner?.status === 'pending' ? (
          // Show pending status
          <>
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
              <p className="text-lg font-semibold text-amber-200">
                ⏳ Application Pending Review
              </p>
              <p className="mt-2 text-sm text-amber-200/80">
                {partner.name} - Awaiting admin verification
              </p>
              <p className="mt-3 text-xs text-amber-200/60">
                Admin will review your Twitter followers screenshot and approve your application within 24 hours. You will be notified once verified.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
              <h3 className="mb-4 font-semibold text-slate-200">Application Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Partner Name:</p>
                  <p className="mt-1 text-slate-300">{partner.name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Wallet Address:</p>
                  <p className="mt-1 break-all font-mono text-cyan-400">{partner.walletAddress}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status:</p>
                  <p className="mt-1 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    Pending Approval
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Applied on:</p>
                  <p className="mt-1 text-slate-300">
                    {getAppliedOnDate(partner.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : partner?.status === 'rejected' ? (
          // Show rejected status
          <>
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-6">
              <p className="text-lg font-semibold text-red-200">
                ❌ Application Rejected
              </p>
              <p className="mt-2 text-sm text-red-200/80">
                {partner.name}
              </p>
              {partner.rejectionReason && (
                <p className="mt-3 text-sm text-red-200">
                  <span className="font-semibold">Reason:</span> {partner.rejectionReason}
                </p>
              )}
            </div>
          </>
        ) : partner?.status === 'approved' ? (
          // Show dashboard for approved partners
          <>
            <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm font-semibold text-green-200">
                ✓ Partnership Approved
              </p>
            </div>
            <PartnerDashboard partner={partner} />
          </>
        ) : (
          // Show Registration Form if no partner
          <>
            <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm font-semibold text-blue-200">
                Create a new partner account to start earning
              </p>
            </div>
            <PartnerRegistrationForm
              walletAddress={address!}
              onSuccess={handleRegistrationSuccess}
            />
          </>
        )}
      </main>
    </div>
  );
}
