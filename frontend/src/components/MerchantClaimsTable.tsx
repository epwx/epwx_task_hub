import React from "react";

interface MerchantClaim {
  id: number | string;
  customer: string;
  bill: string;
  status: string;
  createdAt: string;
}

interface MerchantClaimsTableProps {
  claims: MerchantClaim[];
  isAdmin?: boolean;
  onDistribute?: (claim: MerchantClaim) => void;
  marking?: number | string | null;
}

const MerchantClaimsTable: React.FC<MerchantClaimsTableProps> = ({ claims, isAdmin = false, onDistribute, marking }) => (
  <div className="overflow-x-auto w-full">
    <table className="min-w-full bg-white rounded shadow text-xs sm:text-sm">
      <thead className="bg-gray-200">
        <tr>
          <th className="py-2 px-2 sm:px-4 text-gray-700">ID</th>
          <th className="py-2 px-2 sm:px-4 text-gray-700">Customer</th>
          <th className="py-2 px-2 sm:px-4 text-gray-700">Bill</th>
          <th className="py-2 px-2 sm:px-4 text-gray-700">Status</th>
          <th className="py-2 px-2 sm:px-4 text-gray-700">Date</th>
          {isAdmin && <th className="py-2 px-2 sm:px-4 text-gray-700">Action</th>}
        </tr>
      </thead>
      <tbody>
        {claims.map((claim) => (
          <tr key={claim.id} className="border-b last:border-none">
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claim.id}</td>
            <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{claim.customer}</td>
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claim.bill}</td>
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 capitalize">{claim.status}</td>
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{new Date(claim.createdAt).toLocaleString()}</td>
            {isAdmin && (
              <td className="py-2 px-2 sm:px-4 bg-white">
                {claim.status === "pending" ? (
                  <button
                    className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
                    disabled={marking === claim.id}
                    onClick={() => onDistribute && onDistribute(claim)}
                  >
                    {marking === claim.id ? "Distributing..." : `Distribute EPWX`}
                  </button>
                ) : (
                  <span className="text-green-600 font-semibold">Paid</span>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MerchantClaimsTable;
