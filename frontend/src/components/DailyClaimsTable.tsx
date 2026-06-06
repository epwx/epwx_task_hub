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
  <div className="w-full overflow-x-auto rounded border border-slate-200 shadow-sm dark:border-slate-800">
    <table className="min-w-[760px] w-full bg-white text-xs dark:bg-slate-900 sm:text-sm">
      <thead className="bg-slate-200 dark:bg-slate-800">
        <tr>
          <th className="min-w-[220px] py-2 px-2 text-left text-slate-700 dark:text-slate-200 sm:px-4">Wallet</th>
          <th className="min-w-[140px] py-2 px-2 text-left text-slate-700 dark:text-slate-200 sm:px-4">IP</th>
          <th className="min-w-[190px] py-2 px-2 text-left text-slate-700 dark:text-slate-200 sm:px-4">Claimed At</th>
          <th className="min-w-[140px] py-2 px-2 text-left text-slate-700 dark:text-slate-200 sm:px-4">Amount</th>
          <th className="min-w-[100px] py-2 px-2 text-left text-slate-700 dark:text-slate-200 sm:px-4">Status</th>
          {isAdmin && <th className="min-w-[180px] py-2 px-2 text-left text-slate-700 dark:text-slate-200 sm:px-4">Action</th>}
        </tr>
      </thead>
      <tbody>
        {claims.map((claim) => (
          <tr key={claim.id} className="align-top border-b border-slate-200 last:border-none dark:border-slate-800">
            <td className="break-all bg-white py-2 px-2 font-mono text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">{claim.wallet}</td>
            <td className="whitespace-nowrap bg-white py-2 px-2 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">{claim.ip}</td>
            <td className="whitespace-nowrap bg-white py-2 px-2 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">{new Date(claim.claimedAt).toLocaleString()}</td>
            <td className="whitespace-nowrap bg-white py-2 px-2 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">{Number(claim.amount || "100000").toLocaleString()} EPWX</td>
            <td className="whitespace-nowrap bg-white py-2 px-2 capitalize text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-4">{claim.status}</td>
            {isAdmin && (
              <td className="whitespace-nowrap bg-white py-2 px-2 dark:bg-slate-900 sm:px-4">
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
