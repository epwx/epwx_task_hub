import React from "react";

interface MerchantClaim {
  id: number | string;
  customer: string;
  bill: string;
  status: string;
  createdAt: string;
  cashbackAmount?: string | number;
  amount?: string | number;
  receiptImage?: string;
  rejectionComment?: string;
}

interface MerchantClaimsTableProps {
  claims: MerchantClaim[];
  isAdmin?: boolean;
  onDistribute?: (claim: MerchantClaim) => void;
  marking?: number | string | null;
}


import React, { useState } from "react";

const MerchantClaimsTable: React.FC<MerchantClaimsTableProps> = ({ claims, isAdmin = false, onDistribute, marking }) => {
  const [rejectingId, setRejectingId] = useState<number | string | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Dummy reject handler, to be replaced by parent
  const onReject = async (claim: MerchantClaim, comment: string) => {
    // Should be passed as prop for real use
    alert(`Rejected claim ${claim.id} with comment: ${comment}`);
    setRejectingId(null);
    setRejectionComment("");
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full bg-white rounded shadow text-xs sm:text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-2 sm:px-4 text-gray-700">ID</th>
            <th className="py-2 px-2 sm:px-4 text-gray-700">Customer</th>
            <th className="py-2 px-2 sm:px-4 text-gray-700">Bill</th>
            <th className="py-2 px-2 sm:px-4 text-gray-700">EPWX</th>
            <th className="py-2 px-2 sm:px-4 text-gray-700">Status</th>
            <th className="py-2 px-2 sm:px-4 text-gray-700">Date</th>
            <th className="py-2 px-2 sm:px-4 text-gray-700">Receipt</th>
            {isAdmin && <th className="py-2 px-2 sm:px-4 text-gray-700">Action</th>}
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="border-b last:border-none">
              <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claim.id}</td>
              <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{claim.customer}</td>
              <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claim.bill}</td>
              <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">
                {/* Show the EPWX amount to be distributed */}
                {(() => {
                  let val = claim.cashbackAmount || claim.amount || claim.bill;
                  if (!val || Number(val) === 0) val = "100000";
                  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 9 });
                })()}
              </td>
              <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 capitalize">
                {claim.status}
                {claim.status === "rejected" && claim.rejectionComment && (
                  <div className="text-xs text-red-600 mt-1">Reason: {claim.rejectionComment}</div>
                )}
              </td>
              <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{new Date(claim.createdAt).toLocaleString()}</td>
              <td className="py-2 px-2 sm:px-4 bg-white text-blue-700 underline cursor-pointer">
                {claim.receiptImage ? (
                  <button onClick={() => setViewImage(claim.receiptImage)}>View Receipt</button>
                ) : (
                  <span className="text-gray-400">No Image</span>
                )}
              </td>
              {isAdmin && (
                <td className="py-2 px-2 sm:px-4 bg-white">
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
                            className="border rounded p-1 text-xs"
                            rows={2}
                            placeholder="Enter rejection reason..."
                            value={rejectionComment}
                            onChange={e => setRejectionComment(e.target.value)}
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              className="bg-red-700 text-white px-2 py-1 rounded text-xs"
                              disabled={!rejectionComment.trim()}
                              onClick={() => onReject(claim, rejectionComment)}
                            >
                              Confirm Reject
                            </button>
                            <button
                              className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs"
                              onClick={() => { setRejectingId(null); setRejectionComment(""); }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-green-600 font-semibold">Paid</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modal for viewing receipt image */}
      {viewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-4 relative max-w-lg w-full">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setViewImage(null)}>&times;</button>
            <img src={viewImage} alt="Receipt" className="max-w-full max-h-[70vh] mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantClaimsTable;
