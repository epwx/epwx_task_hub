

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

interface MerchantClaimsTableProps {
  claims: MerchantClaim[];
  isAdmin?: boolean;
  onDistribute?: (claim: MerchantClaim) => void;
  onReject?: (claim: MerchantClaim, rejectionComment: string) => void;
  marking?: number | string | null;
  context?: 'merchant' | 'twitter';
}



import React, { useState } from "react";

// Set your backend API base URL here (should match production backend domain)
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.epowex.com";

const MerchantClaimsTable: React.FC<MerchantClaimsTableProps> = ({ claims, isAdmin = false, onDistribute, onReject, marking, context = 'merchant' }) => {
  const [rejectingId, setRejectingId] = useState<number | string | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Helper to get absolute image URL
  const getImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return '';
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    // Ensure leading slash
    const relPath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
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
    <div className="overflow-x-auto w-full">
      <table className="min-w-full rounded border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:text-sm">
        <thead className="bg-slate-200 dark:bg-slate-800">
          <tr>
            <th className="py-2 px-2 text-slate-700 dark:text-slate-200 sm:px-4">ID</th>
            <th className="py-2 px-2 text-slate-700 dark:text-slate-200 sm:px-4">Customer</th>
            <th className="py-2 px-2 text-slate-700 dark:text-slate-200 sm:px-4">{context === 'twitter' ? 'Campaign' : 'Bill'}</th>
            <th className="py-2 px-2 text-slate-700 dark:text-slate-200 sm:px-4">EPWX</th>
            <th className="py-2 px-2 text-slate-700 dark:text-slate-200 sm:px-4">Status</th>
            <th className="py-2 px-2 text-slate-700 dark:text-slate-200 sm:px-4">Date</th>
            <th className="py-2 px-2 text-slate-700 dark:text-slate-200 sm:px-4">{context === 'twitter' ? 'Screenshot' : 'Receipt'}</th>
            {isAdmin && <th className="py-2 px-2 text-slate-700 dark:text-slate-200 sm:px-4">Action</th>}
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="border-b border-slate-200 last:border-none dark:border-slate-800">
              <td className="bg-white py-2 px-2 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">{claim.id}</td>
              <td className="break-all bg-white py-2 px-2 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">{claim.customer}</td>
              <td className="bg-white py-2 px-2 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">
                {context === 'twitter' ? (
                  <div>
                    <div className="font-medium">{claim.campaignCode || getTwitterClaimFallbackLabel(claim.claimType)}</div>
                    {claim.twitterUsername ? <div className="text-xs text-slate-500 dark:text-slate-400">@{claim.twitterUsername}</div> : null}
                  </div>
                ) : (
                  claim.bill
                )}
              </td>
              <td className="bg-white py-2 px-2 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">
                {/* Show the EPWX amount to be distributed */}
                {(() => {
                  let val = claim.cashbackAmount || claim.amount || claim.bill;
                  if (!val || Number(val) === 0) val = "100000";
                  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 9 });
                })()}
              </td>
              <td className="bg-white py-2 px-2 capitalize text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">
                {claim.status}
                {claim.status === "rejected" && claim.rejectionComment && (
                  <div className="text-xs text-red-600 mt-1">Reason: {claim.rejectionComment}</div>
                )}
              </td>
              <td className="bg-white py-2 px-2 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">{new Date(claim.createdAt).toLocaleString()}</td>
              <td className="cursor-pointer bg-white py-2 px-2 text-blue-700 underline dark:bg-slate-900 dark:text-blue-300 sm:px-4">
                {claim.receiptImage ? (
                  <button onClick={() => setViewImage(getImageUrl(claim.receiptImage))}>{context === 'twitter' ? 'View Screenshot' : 'View Receipt'}</button>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">No Image</span>
                )}
              </td>
              {isAdmin && (
                <td className="bg-white py-2 px-2 dark:bg-slate-900 sm:px-4">
                  {claim.status === "pending" ? (
                    <div className="flex flex-col gap-2">
                      <button
                        className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
                        disabled={marking === claim.id}
                        onClick={() => onDistribute && onDistribute(claim)}
                      >
                        {marking === claim.id ? "Distributing..." : `Distribute EPWX`}
                      </button>
                      <button
                        className="px-2 sm:px-4 py-1 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm"
                        onClick={() => setRejectingId(claim.id)}
                      >
                        Reject
                      </button>
                      {rejectingId === claim.id && (
                        <div className="mt-2 flex flex-col gap-1">
                          <textarea
                            className="rounded border border-slate-300 bg-white p-1 text-xs text-slate-900 placeholder-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                            rows={2}
                            placeholder="Enter rejection reason..."
                            value={rejectionComment}
                            onChange={e => setRejectionComment(e.target.value)}
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              className="bg-red-700 text-white px-2 py-1 rounded text-xs"
                              disabled={!rejectionComment.trim()}
                              onClick={() => handleReject(claim, rejectionComment)}
                            >
                              Confirm Reject
                            </button>
                            <button
                              className="rounded bg-slate-300 px-2 py-1 text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                              onClick={() => { setRejectingId(null); setRejectionComment(""); }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : claim.status === "paid" ? (
                    <span className="text-green-600 font-semibold">Paid</span>
                  ) : claim.status === "rejected" ? (
                    <span className="text-red-600 font-semibold">Rejected</span>
                  ) : null}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modal for viewing receipt image */}
      {viewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative w-full max-w-lg rounded bg-white p-4 shadow-lg dark:bg-slate-900">
            <button className="absolute top-2 right-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setViewImage(null)}>&times;</button>
            <img
              src={viewImage}
              alt="Receipt"
              className="max-w-full max-h-[70vh] mx-auto"
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
