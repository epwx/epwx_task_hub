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
    toast.success("Partner registered successfully!");
  };

  const shellClass = "ui-surface-strong relative overflow-hidden p-5 sm:p-6 lg:p-8";
  const walletSummary = isConnected && address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : "Wallet not connected";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-blue-600/12 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl space-y-6">
        <section className={shellClass}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Partner Verification
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Partner Portal
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Register, monitor verification status, and manage approved partner activity inside the standardized EPWX shell.
              </p>
            </div>
            <div className="ui-surface self-start px-4 py-3 text-sm text-slate-200">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Access requirement
              </div>
              <div className="mt-1 font-semibold text-white">Wallet connection required</div>
              <div className="mt-1 text-slate-300">Registration and dashboard data stay bound to the connected payout wallet.</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="ui-surface relative overflow-hidden p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Wallet status</p>
              <p className="mt-2 text-2xl font-black text-white">
                {isConnected ? "Connected" : "Required"}
              </p>
              <p className="mt-2 break-all text-sm text-slate-300">{walletSummary}</p>
            </div>
            <div className="ui-surface relative overflow-hidden p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-400/10 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Verification stage</p>
              <p className="mt-2 text-2xl font-black text-white">
                {partner ? partner.status.charAt(0).toUpperCase() + partner.status.slice(1) : "New"}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {partner ? "Current partner application status on file." : "Start a new partner application when your wallet is connected."}
              </p>
            </div>
            <div className="ui-surface relative overflow-hidden p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Review timing</p>
              <p className="mt-2 text-2xl font-black text-white">24h</p>
              <p className="mt-2 text-sm text-slate-300">Pending applications are reviewed after evidence submission and wallet verification.</p>
            </div>
          </div>
        </section>

        <section className={`${shellClass} space-y-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Connection</p>
              <h2 className="mt-1 text-xl font-bold text-white">Wallet Access</h2>
              <p className="mt-1 text-sm text-slate-300">
                {isConnected ? "Your wallet is connected and ready for partner actions." : "Connect a wallet to register or open your partner workspace."}
              </p>
            </div>
            <ConnectKitButton />
          </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center sm:p-12">
            <p className="text-lg font-semibold text-amber-100">
              Connect Your Wallet
            </p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-amber-200/80">
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
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
              <p className="text-lg font-semibold text-amber-200">
                ⏳ Application Pending Review
              </p>
              <p className="mt-2 text-sm text-amber-200/80">
                {partner.name} - Awaiting admin verification
              </p>
              <p className="mt-3 text-xs leading-6 text-amber-200/60">
                Admin will review your Twitter followers screenshot and approve your application within 24 hours. You will be notified once verified.
              </p>
            </div>
            <div className="ui-surface p-6">
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
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
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
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm font-semibold text-green-200">
                ✓ Partnership Approved
              </p>
            </div>
            <PartnerDashboard partner={partner} />
          </>
        ) : (
          // Show Registration Form if no partner
          <>
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
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
        </section>
      </main>
    </div>
  );
}
