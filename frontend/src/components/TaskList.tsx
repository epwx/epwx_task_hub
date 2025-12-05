'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
  id: string;
  title: string;
  taskType: string;
  rewardPerTask: string;
  maxCompletions: number;
  completedCount: number;
  deadline: string;
  status: string;
}

interface TaskListProps {
  limit?: number;
}

export function TaskList({ limit }: TaskListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`,
        {
          params: { status: 'active', limit: limit || 50 }
        }
      );
      setCampaigns(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setLoading(false);
    }
  };

  const formatReward = (reward: string) => {
    const amount = BigInt(reward);
    const billions = Number(amount) / 1e9;
    return `${billions.toFixed(1)}B`;
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'like': return '❤️';
      case 'repost': return '🔄';
      case 'comment': return '💬';
      case 'follow': return '👤';
      default: return '✅';
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No active campaigns at the moment</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTaskIcon(campaign.taskType)}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                {campaign.taskType}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            {campaign.title}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reward:</span>
              <span className="font-semibold text-green-600">
                {formatReward(campaign.rewardPerTask)} EPWX
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-semibold">
                {campaign.maxCompletions - campaign.completedCount} / {campaign.maxCompletions}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expires:</span>
              <span className="font-semibold">
                {formatDistanceToNow(new Date(campaign.deadline), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${(campaign.completedCount / campaign.maxCompletions) * 100}%`
              }}
            ></div>
          </div>

          <Link
            href={`/tasks/${campaign.id}`}
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Task
          </Link>
        </div>
      ))}
    </div>
  );
}
