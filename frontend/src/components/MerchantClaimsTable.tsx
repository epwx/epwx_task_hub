

interface MerchantClaim {
  id: number | string;
  merchantId?: number | null;
  customer: string;
  bill?: string;
  status: string;
  createdAt: string;
  cashbackAmount?: string | number;
  amount?: string | number;
  receiptImage?: string;
  rejectionComment?: string;
  claimType?: string;
  campaignCode?: string;
  twitterUsername?: string;
}

function getTwitterClaimFallbackLabel(claimType?: string) {
  if (claimType === 'twitter_comment') {
    return 'twitter-comment';
  }

  if (claimType === 'twitter_poll') {
    return 'twitter-poll';
  }

  return 'twitter-retweet';
}

function getTwitterTaskTypeLabel(claimType?: string): string {
  if (claimType === 'twitter_comment') {
    return 'Comment';
  }

  if (claimType === 'twitter_poll') {
    return 'Poll';
  }

  if (claimType === 'twitter_retweet') {
    return 'Retweet';
  }

  return 'Unknown';
}

interface MerchantClaimsTableProps {
  claims: MerchantClaim[];
  isAdmin?: boolean;
  onDistribute?: (claim: MerchantClaim) => void;
  onReject?: (claim: MerchantClaim, rejectionComment: string) => void;
  marking?: number | string | null;
  context?: 'merchant' | 'twitter';
}



import React, { useState } from "react";
import { getApiBaseUrl } from '@/utils/apiBaseUrl';

// Use configured API base URL when provided, otherwise fall back to same-origin.
const BACKEND_BASE_URL = getApiBaseUrl();
const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || BACKEND_BASE_URL;

const MerchantClaimsTable: React.FC<MerchantClaimsTableProps> = ({ claims, isAdmin = false, onDistribute, onReject, marking, context = 'merchant' }) => {
  const [rejectingId, setRejectingId] = useState<number | string | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);
  const tableShellClass = 'overflow-x-auto rounded-2xl border border-white/12 bg-slate-950/45 shadow-[0_16px_40px_rgba(2,6,23,0.25)]';

  // Helper to get absolute image URL
  const getImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return '';
    const normalizedPath = imgPath.replace(/\\+/g, '/').replace(/^\.\//, '');
    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) return normalizedPath;
    // Ensure leading slash
    const relPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    if (relPath.startsWith('/uploads/')) {
      return `${UPLOADS_BASE_URL}${relPath}`;
    }
    return `${BACKEND_BASE_URL}${relPath}`;
  };


  // Use the passed onReject prop, or fallback to a dummy handler
  const handleReject = async (claim: MerchantClaim, comment: string) => {
    if (typeof onReject === 'function') {
      await onReject(claim, comment);
    }
    setRejectingId(null);
    setRejectionComment("");
  };

  return (
    <div className="w-full">
      <div className={tableShellClass}>
      <table className="min-w-full text-xs text-slate-200 sm:text-sm">
        <thead className="bg-white/[0.06] text-slate-300">
          <tr>
            <th className="px-2 py-3 text-left text-slate-300 sm:px-4">ID</th>
            <th className="px-2 py-3 text-left text-slate-300 sm:px-4">Customer</th>
            <th className="px-2 py-3 text-left text-slate-300 sm:px-4">{context === 'twitter' ? 'Campaign' : 'Bill'}</th>
            {context === 'twitter' && <th className="px-2 py-3 text-left text-slate-300 sm:px-4">Type</th>}
            <th className="px-2 py-3 text-left text-slate-300 sm:px-4">EPWX</th>
            <th className="px-2 py-3 text-left text-slate-300 sm:px-4">Status</th>
            <th className="px-2 py-3 text-left text-slate-300 sm:px-4">Date</th>
            <th className="px-2 py-3 text-left text-slate-300 sm:px-4">{context === 'twitter' ? 'Screenshot' : 'Receipt'}</th>
            {isAdmin && <th className="px-2 py-3 text-left text-slate-300 sm:px-4">Action</th>}
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="border-b border-white/10 last:border-none">
              <td className="bg-transparent px-2 py-3 text-slate-100 sm:px-4">{claim.id}</td>
              <td className="break-all bg-transparent px-2 py-3 text-slate-100 sm:px-4">{claim.customer}</td>
              <td className="bg-transparent px-2 py-3 text-slate-100 sm:px-4">
                {context === 'twitter' ? (
                  <div>
                    <div className="font-medium">{claim.campaignCode || getTwitterClaimFallbackLabel(claim.claimType)}</div>
                    {claim.twitterUsername ? <div className="text-xs text-slate-400">@{claim.twitterUsername}</div> : null}
                  </div>
                ) : (
                  claim.bill
                )}
              </td>
              {context === 'twitter' && (
                <td className="bg-transparent px-2 py-3 text-slate-100 sm:px-4">
                  <span className="inline-block rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                    {getTwitterTaskTypeLabel(claim.claimType)}
                  </span>
                </td>
              )}
              <td className="bg-transparent px-2 py-3 text-slate-100 sm:px-4">
                {/* Show the EPWX amount to be distributed */}
                {(() => {
                  let val = claim.cashbackAmount || claim.amount || claim.bill;
                  if (!val || Number(val) === 0) val = "100000";
                  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 9 });
                })()}
              </td>
              <td className="bg-transparent px-2 py-3 capitalize text-slate-100 sm:px-4">
                {claim.status}
                {claim.status === "rejected" && claim.rejectionComment && (
                  <div className="mt-1 text-xs text-rose-200">Reason: {claim.rejectionComment}</div>
                )}
              </td>
              <td className="bg-transparent px-2 py-3 text-slate-100 sm:px-4">{new Date(claim.createdAt).toLocaleString()}</td>
              <td className="cursor-pointer bg-transparent px-2 py-3 text-cyan-200 underline decoration-cyan-200/70 underline-offset-2 sm:px-4">
                {claim.receiptImage ? (
                  <button onClick={() => setViewImage(getImageUrl(claim.receiptImage))}>{context === 'twitter' ? 'View Screenshot' : 'View Receipt'}</button>
                ) : (
                  <span className="text-slate-500">No Image</span>
                )}
              </td>
              {isAdmin && (
                <td className="bg-transparent px-2 py-3 sm:px-4">
                  {claim.status === "pending" ? (
                    <div className="flex flex-col gap-2">
                      <button
                        className="rounded-xl bg-cyan-500 px-2 py-1 text-xs text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                        disabled={marking === claim.id}
                        onClick={() => onDistribute && onDistribute(claim)}
                      >
                        {marking === claim.id ? "Distributing..." : `Distribute EPWX`}
                      </button>
                      <button
                        className="rounded-xl bg-rose-500 px-2 py-1 text-xs text-white transition-colors hover:bg-rose-400 sm:px-4 sm:py-2 sm:text-sm"
                        onClick={() => setRejectingId(claim.id)}
                      >
                        Reject
                      </button>
                      {rejectingId === claim.id && (
                        <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <textarea
                            className="rounded-xl border border-white/15 bg-slate-950/40 p-2 text-xs text-white placeholder-slate-500"
                            rows={2}
                            placeholder="Enter rejection reason..."
                            value={rejectionComment}
                            onChange={e => setRejectionComment(e.target.value)}
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              className="rounded-lg bg-rose-600 px-2 py-1 text-xs text-white transition-colors hover:bg-rose-500"
                              disabled={!rejectionComment.trim()}
                              onClick={() => handleReject(claim, rejectionComment)}
                            >
                              Confirm Reject
                            </button>
                            <button
                              className="rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-100 transition-colors hover:bg-white/15"
                              onClick={() => { setRejectingId(null); setRejectionComment(""); }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : claim.status === "paid" ? (
                    <span className="font-semibold text-emerald-200">Paid</span>
                  ) : claim.status === "rejected" ? (
                    <span className="font-semibold text-rose-200">Rejected</span>
                  ) : null}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {/* Modal for viewing receipt image */}
      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl">
            <button className="absolute right-3 top-2 text-2xl text-white/60 hover:text-white" onClick={() => setViewImage(null)}>&times;</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewImage}
              alt="Receipt"
              className="mx-auto max-h-[70vh] max-w-full rounded-2xl"
              onError={e => {
                // Only set fallback if not already set
                const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="16">Image not found</text></svg>';
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantClaimsTable;
