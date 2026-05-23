"use client";

import { useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import MerchantClaimsTable from "@/components/MerchantClaimsTable";

type TwitterClaim = {
  id: number | string;
  customer: string;
  bill?: string;
  status: string;
  createdAt: string;
  receiptImage?: string;
  rejectionComment?: string;
  campaignCode?: string;
  twitterUsername?: string;
};

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
  .split(",")
  .map(wallet => wallet.trim().toLowerCase())
  .filter(Boolean);

export default function AdminTwitterClaimsPage() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [claims, setClaims] = useState<TwitterClaim[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<number | string | null>(null);

  const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || "0x0000000000000000000000000000000000000000";
  const EPWX_TOKEN_ABI = [
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  const isAdmin = !!address && ADMIN_WALLETS.includes(address.toLowerCase());

  const fetchClaims = async () => {
    if (!address || !isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/claims?admin=${address}&status=${statusFilter}&claimType=twitter_retweet`);
      const data = await response.json();
      setClaims(data.claims || []);
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch Twitter claims");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, [address, statusFilter]);

  const rejectClaim = async (claim: TwitterClaim, rejectionComment: string) => {
    setMarking(claim.id);
    setError(null);

    try {
      const response = await fetch(`/api/claims/${claim.id}/mark-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, status: "rejected", rejectionComment }),
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to reject claim");
      } else {
        await fetchClaims();
      }
    } catch (rejectError: any) {
      setError(rejectError?.message || "Failed to reject claim");
    }

    setMarking(null);
  };

  const distributeClaim = async (claim: TwitterClaim) => {
    setMarking(claim.id);
    setError(null);

    try {
      const amount = ethers.parseUnits("100000", 9).toString();
      const txHash = await writeContractAsync({
        address: EPWX_TOKEN_ADDRESS,
        abi: EPWX_TOKEN_ABI,
        functionName: "transfer",
        args: [claim.customer as `0x${string}`, amount],
      });

      const response = await fetch("/api/epwx/claims/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: address, claimId: claim.id, txHash }),
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to mark claim as paid");
      } else {
        await fetchClaims();
      }
    } catch (distributionError: any) {
      setError(distributionError?.message || "Failed to distribute EPWX");
    }

    setMarking(null);
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-lg font-semibold text-gray-700">Connect an admin wallet to review Twitter screenshot claims.</div>
        <ConnectKitButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Twitter Retweet Claims</h1>
          <p className="mt-2 text-sm text-gray-600">Review uploaded retweet screenshots, then distribute EPWX or reject with a reason.</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="rounded-2xl bg-white p-6 shadow">Loading claims...</div> : null}

      {!loading && claims.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow">No Twitter retweet claims match the current filter.</div>
      ) : null}

      {!loading && claims.length > 0 ? (
        <MerchantClaimsTable
          claims={claims}
          isAdmin
          onDistribute={distributeClaim}
          onReject={rejectClaim}
          marking={marking}
          context="twitter"
        />
      ) : null}
    </div>
  );
}