"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

interface PendingPartner {
  id: string;
  name: string;
  walletAddress: string;
  status: string;
  verificationImagePath: string;
  telegramChannel?: string;
  xProfile?: string;
  createdAt: string;
}

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").split(",").map(w => w.trim().toLowerCase()).filter(Boolean);

export default function AdminPartnerPage() {
  const { address } = useAccount();
  const [partners, setPartners] = useState<PendingPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<{ [key: string]: boolean }>({});

  const isAdmin = address && ADMIN_WALLETS.includes(address.toLowerCase());

  const fetchPendingPartners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/partners/admin/pending", {
        headers: {
          "x-admin-wallet": address || "",
        },
      });

      const data = await response.json();

      if (data.success) {
        setPartners(data.partners || []);
      } else {
        toast.error("Failed to load pending partners");
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("An error occurred while loading partners");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingPartners();
    }
  }, [fetchPendingPartners, isAdmin]);

  const handleApprove = async (partnerId: string) => {
    try {
      setActionInProgress(partnerId);
      const response = await fetch(`/api/partners/${partnerId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-wallet": address || "",
        },
        body: JSON.stringify({
          status: "approved",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to approve partner");
        return;
      }

      toast.success("Partner approved successfully");
      await fetchPendingPartners();
    } catch (error) {
      console.error("Error approving partner:", error);
      toast.error("An error occurred while approving");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (partnerId: string) => {
    const reason = rejectReason[partnerId]?.trim();

    if (!reason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setActionInProgress(partnerId);
      const response = await fetch(`/api/partners/${partnerId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-wallet": address || "",
        },
        body: JSON.stringify({
          status: "rejected",
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to reject partner");
        return;
      }

      toast.success("Partner rejected successfully");
      setRejectReason({ ...rejectReason, [partnerId]: "" });
      setShowRejectForm({ ...showRejectForm, [partnerId]: false });
      await fetchPendingPartners();
    } catch (error) {
      console.error("Error rejecting partner:", error);
      toast.error("An error occurred while rejecting");
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-12 text-center">
            <p className="text-lg font-semibold text-red-100">Access Denied</p>
            <p className="mt-2 text-sm text-red-200/80">
              You do not have permission to access this page
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Partner Verification</h1>
          <p className="mt-2 text-sm text-slate-400">
            Review and approve pending partner applications
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
              <p className="text-slate-400">Loading pending partners...</p>
            </div>
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-12 text-center">
            <p className="text-slate-400">No pending partners</p>
            <p className="mt-1 text-xs text-slate-500">All applications have been reviewed</p>
          </div>
        ) : (
          <div className="space-y-6">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Partner Info */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-400">Name</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {partner.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Wallet</p>
                      <p className="mt-1 break-all font-mono text-sm text-cyan-400">
                        {partner.walletAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Applied</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {new Date(partner.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {partner.telegramChannel && (
                      <div>
                        <p className="text-xs text-slate-400">Telegram</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {partner.telegramChannel}
                        </p>
                      </div>
                    )}
                    {partner.xProfile && (
                      <div>
                        <p className="text-xs text-slate-400">X/Twitter</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {partner.xProfile}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Verification Image and Actions */}
                  <div className="space-y-4">
                    {partner.verificationImagePath && (
                      <div>
                        <p className="mb-2 text-xs text-slate-400">
                          Twitter Followers Screenshot
                        </p>
                        <a
                          href={`/${partner.verificationImagePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/${partner.verificationImagePath}`}
                            alt="Verification"
                            className="max-h-40 rounded-lg border border-white/10 hover:opacity-90"
                          />
                        </a>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApprove(partner.id)}
                        disabled={actionInProgress === partner.id}
                        className="flex-1 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/30 disabled:opacity-50 border border-green-500/30"
                      >
                        {actionInProgress === partner.id ? "..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() =>
                          setShowRejectForm({
                            ...showRejectForm,
                            [partner.id]: !showRejectForm[partner.id],
                          })
                        }
                        className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 border border-red-500/30"
                      >
                        ✕ Reject
                      </button>
                    </div>

                    {/* Reject Form */}
                    {showRejectForm[partner.id] && (
                      <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                        <label className="block text-xs font-semibold text-red-300">
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectReason[partner.id] || ""}
                          onChange={(e) =>
                            setRejectReason({
                              ...rejectReason,
                              [partner.id]: e.target.value,
                            })
                          }
                          placeholder="Explain why this application is rejected..."
                          className="mt-2 w-full rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-200 placeholder-red-500/50 focus:border-red-500 focus:outline-none"
                          rows={3}
                        />
                        <button
                          onClick={() => handleReject(partner.id)}
                          disabled={actionInProgress === partner.id}
                          className="mt-2 w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          {actionInProgress === partner.id
                            ? "Rejecting..."
                            : "Confirm Rejection"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
