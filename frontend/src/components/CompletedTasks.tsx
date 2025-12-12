'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface CompletedTask {
  id: string;
  completionId: number | null;
  rewardAmount: string;
  transactionHash: string;
  createdAt: string;
  metadata: {
    campaignId: number;
    taskType: string;
    targetUrl: string;
  };
}

export function CompletedTasks() {
  const { address } = useAccount();
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/tasks/completed/${address}`);
        if (response.data.success) {
          setTasks(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching completed tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedTasks();
  }, [address]);

  if (!address) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-12 text-gray-500">
          <p>No activity yet. Start completing tasks to earn EPWX!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                {task.metadata.taskType === 'like' && '❤️'}
                {task.metadata.taskType === 'follow' && '👥'}
                {task.metadata.taskType === 'share' && '🔗'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Campaign #{task.metadata.campaignId} - {task.metadata.taskType.charAt(0).toUpperCase() + task.metadata.taskType.slice(1)}
                </p>
                <p className="text-sm text-gray-600">
                  Earned {Number(task.rewardAmount).toLocaleString()} EPWX
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(task.createdAt).toLocaleDateString()} at {new Date(task.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <a
              href={`https://basescan.org/tx/${task.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              View Tx
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
