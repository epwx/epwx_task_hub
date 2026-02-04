import React from "react";

interface DailyClaim {
  id: string;
  wallet: string;
  ip: string;
  claimedAt: string;
  status: string;
}

interface DailyClaimsTableProps {
  claims: DailyClaim[];
  isAdmin?: boolean;
  onDistribute?: (claim: DailyClaim) => void;
  marking?: number | string | null;
}

const DailyClaimsTable: React.FC<DailyClaimsTableProps> = ({ claims, isAdmin = false, onDistribute, marking }) => (
  <table className="min-w-full bg-white rounded shadow text-xs sm:text-sm">
    <thead className="bg-gray-200">
      <tr>
        <th className="py-2 px-2 sm:px-4 text-gray-700">Wallet</th>
        <th className="py-2 px-2 sm:px-4 text-gray-700">IP</th>
        <th className="py-2 px-2 sm:px-4 text-gray-700">Claimed At</th>
        <th className="py-2 px-2 sm:px-4 text-gray-700">Status</th>
        {isAdmin && <th className="py-2 px-2 sm:px-4 text-gray-700">Action</th>}
      </tr>
    </thead>
    <tbody>
      {claims.map((claim) => (
        <tr key={claim.id} className="border-b last:border-none">
          <td className="py-2 px-2 sm:px-4 break-all bg-white text-gray-900">{claim.wallet}</td>
          <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{claim.ip}</td>
          <td className="py-2 px-2 sm:px-4 bg-white text-gray-900">{new Date(claim.claimedAt).toLocaleString()}</td>
          <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 capitalize">{claim.status}</td>
          {isAdmin && (
            <td className="py-2 px-2 sm:px-4 bg-white">
              {claim.status === "pending" ? (
                <button
                  className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
                  disabled={marking === claim.id}
                  onClick={() => onDistribute && onDistribute(claim)}
                >
                  {marking === claim.id ? "Distributing..." : `Distribute Daily EPWX`}
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
);

export default DailyClaimsTable;
