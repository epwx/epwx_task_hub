'use client';

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TaskSubmissionModal } from './TaskSubmissionModal';

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
  // Show the most recent campaigns (reverse order, latest first)
  const campaignIds = count > 0 
    ? Array.from({ length: Math.min(count, 10) }, (_, i) => count - 1 - i) 
    : [];

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
  const [showModal, setShowModal] = useState(false);
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
  
  // Debug logging
  console.log(`Campaign ${campaignId}:`, {
    advertiser,
    taskType,
    active,
    deadline: new Date(Number(deadline) * 1000).toISOString(),
    isExpired: Number(deadline) * 1000 < Date.now(),
    now: new Date().toISOString()
  });
  
  // Validate data
  if (!advertiser || advertiser === '0x0000000000000000000000000000000000000000') {
    console.log(`Campaign ${campaignId} filtered: Invalid advertiser`);
    return null;
  }

  const reward = formatUnits(rewardPerTask, 9);
  const slotsLeft = Number(maxCompletions - completedCount);
  const isExpired = Number(deadline) * 1000 < Date.now();

  if (!active) {
    console.log(`Campaign ${campaignId} filtered: Not active`);
    return null;
  }
  
  if (isExpired) {
    console.log(`Campaign ${campaignId} filtered: Expired`);
    return null;
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-transparent hover:border-blue-200 hover:-translate-y-1 overflow-hidden">
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {taskType === 'like' && (
                <span className="text-lg">❤️</span>
              )}
              {taskType === 'follow' && (
                <span className="text-lg">👥</span>
              )}
              {taskType === 'share' && (
                <span className="text-lg">🔗</span>
              )}
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {taskType.charAt(0).toUpperCase() + taskType.slice(1)} Campaign #{campaignId}
              </h3>
            </div>
            <p className="text-sm text-gray-600 font-mono">
              {advertiser.slice(0, 6)}...{advertiser.slice(-4)}
            </p>
          </div>
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md animate-pulse">
            ● ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 text-lg opacity-20">💰</div>
            <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Reward</p>
            <p className="text-xl font-black text-blue-700">
              {Number(reward).toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 font-medium">EPWX</p>
          </div>
          <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 text-lg opacity-20">🎯</div>
            <p className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-wide">Slots Available</p>
            <p className="text-xl font-black text-purple-700">
              {slotsLeft}
            </p>
            <p className="text-xs text-purple-600 font-medium">of {Number(maxCompletions)}</p>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Campaign Progress</p>
            <p className="text-xs font-bold text-gray-700">
              {Math.round((Number(completedCount) / Number(maxCompletions)) * 100)}%
            </p>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{
                width: `${(Number(completedCount) / Number(maxCompletions)) * 100}%`
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Complete Task</span>
            <span className="text-xl">→</span>
          </button>
          <button
            onClick={() => window.open(`https://basescan.org/address/${TASK_MANAGER_ADDRESS}#readContract`, '_blank')}
            className="px-5 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl hover:bg-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            title="View on BaseScan"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Expires: {new Date(Number(deadline) * 1000).toLocaleDateString()}</span>
          </div>
          <a 
            href={targetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-semibold text-blue-600 hover:text-purple-600 transition-colors flex items-center gap-1"
          >
            View Task
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Task Submission Modal */}
      {showModal && (
        <TaskSubmissionModal
          campaignId={campaignId}
          taskType={taskType}
          targetUrl={targetUrl}
          reward={Number(reward).toLocaleString()}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            console.log('Task submitted successfully');
            // Could trigger a refetch here
          }}
        />
      )}
    </div>
  );
}
