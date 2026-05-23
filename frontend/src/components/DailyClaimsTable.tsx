import React from "react";

interface DailyClaim {
  id: string;
  wallet: string;
  ip: string;
  claimedAt: string;
  amount?: string;
  status: string;
}

interface DailyClaimsTableProps {
  claims: DailyClaim[];
  isAdmin?: boolean;
  onDistribute?: (claim: DailyClaim) => void;
  marking?: number | string | null;
}

const DailyClaimsTable: React.FC<DailyClaimsTableProps> = ({ claims, isAdmin = false, onDistribute, marking }) => (
  <div className="w-full overflow-x-auto rounded shadow">
    <table className="min-w-[760px] w-full bg-white text-xs sm:text-sm">
      <thead className="bg-gray-200">
        <tr>
          <th className="py-2 px-2 sm:px-4 text-left text-gray-700 min-w-[220px]">Wallet</th>
          <th className="py-2 px-2 sm:px-4 text-left text-gray-700 min-w-[140px]">IP</th>
          <th className="py-2 px-2 sm:px-4 text-left text-gray-700 min-w-[190px]">Claimed At</th>
          <th className="py-2 px-2 sm:px-4 text-left text-gray-700 min-w-[140px]">Amount</th>
          <th className="py-2 px-2 sm:px-4 text-left text-gray-700 min-w-[100px]">Status</th>
          {isAdmin && <th className="py-2 px-2 sm:px-4 text-left text-gray-700 min-w-[180px]">Action</th>}
        </tr>
      </thead>
      <tbody>
        {claims.map((claim) => (
          <tr key={claim.id} className="border-b last:border-none align-top">
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 font-mono break-all">{claim.wallet}</td>
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 whitespace-nowrap">{claim.ip}</td>
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 whitespace-nowrap">{new Date(claim.claimedAt).toLocaleString()}</td>
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 whitespace-nowrap">{Number(claim.amount || "100000").toLocaleString()} EPWX</td>
            <td className="py-2 px-2 sm:px-4 bg-white text-gray-900 capitalize whitespace-nowrap">{claim.status}</td>
            {isAdmin && (
              <td className="py-2 px-2 sm:px-4 bg-white whitespace-nowrap">
                {claim.status === "pending" ? (
                  <div className="flex flex-col items-start">
                    <button
                      className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
                      disabled={marking === claim.id}
                      onClick={() => onDistribute && onDistribute(claim)}
                    >
                      {marking === claim.id ? "Distributing..." : `Distribute Daily EPWX`}
                    </button>
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
  </div>
);

export default DailyClaimsTable;
