'use client';

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

const TASK_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_TASK_MANAGER || '') as `0x${string}`;

const TASK_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "campaignIdCounter",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "campaigns",
    "outputs": [
      {"name": "advertiser", "type": "address"},
      {"name": "taskType", "type": "string"},
      {"name": "targetUrl", "type": "string"},
      {"name": "rewardPerTask", "type": "uint256"},
      {"name": "maxCompletions", "type": "uint256"},
      {"name": "completedCount", "type": "uint256"},
      {"name": "escrowedAmount", "type": "uint256"},
      {"name": "deadline", "type": "uint256"},
      {"name": "active", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function TaskList() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSkeleton />;
  }

  return <TaskListContent />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Available Tasks</h2>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskListContent() {
  const { data: campaignCount, isLoading, error } = useReadContract({
    address: TASK_MANAGER_ADDRESS,
    abi: TASK_MANAGER_ABI,
    functionName: 'campaignIdCounter',
  });

  const count = campaignCount ? Number(campaignCount) : 0;
  const campaignIds = count > 0 ? Array.from({ length: Math.min(count, 10) }, (_, i) => i + 1) : [];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">Error loading campaigns. Please check your wallet connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Available Tasks</h2>
        <span className="text-sm text-gray-600">
          {count} Total Campaign{count !== 1 ? 's' : ''}
        </span>
      </div>

      {count === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Available</h3>
          <p className="text-gray-600 mb-4">
            Be the first to create a campaign!
          </p>
          <a
            href="/advertise"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Campaign
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaignIds.map((id) => (
            <CampaignCard key={id} campaignId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaignId }: { campaignId: number }) {
  const { data: campaign, isLoading } = useReadContract({
    address: TASK_MANAGER_ADDRESS,
    abi: TASK_MANAGER_ABI,
    functionName: 'campaigns',
    args: [BigInt(campaignId)],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const [advertiser, taskType, targetUrl, rewardPerTask, maxCompletions, completedCount, escrowedAmount, deadline, active] = campaign;
  
  // Validate data
  if (!advertiser || advertiser === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  const reward = formatUnits(rewardPerTask, 9);
  const slotsLeft = Number(maxCompletions - completedCount);
  const isExpired = Number(deadline) * 1000 < Date.now();

  if (!active || isExpired) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {taskType.charAt(0).toUpperCase() + taskType.slice(1)} Campaign #{campaignId}
          </h3>
          <p className="text-sm text-gray-600">
            Created by: {advertiser.slice(0, 6)}...{advertiser.slice(-4)}
          </p>
        </div>
        <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-1">Reward</p>
          <p className="text-lg font-bold text-blue-600">
            {Number(reward).toLocaleString()} EPWX
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-1">Slots Left</p>
          <p className="text-lg font-bold text-purple-600">
            {slotsLeft} / {Number(maxCompletions)}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Progress</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{
              width: `${(Number(completedCount) / Number(maxCompletions)) * 100}%`
            }}
          ></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => alert('Task submission feature coming soon! Campaign ID: ' + campaignId)}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Complete Task
        </button>
        <button
          onClick={() => window.open(`https://basescan.org/address/${TASK_MANAGER_ADDRESS}#readContract`, '_blank')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="View on BaseScan"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Expires: {new Date(Number(deadline) * 1000).toLocaleDateString()}
      </p>
    </div>
  );
}
