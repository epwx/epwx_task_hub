'use client';

import { Header } from "@/components/Header";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function AdvertisePage() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'like',
    targetUrl: '',
    rewardPerTask: '',
    maxCompletions: '',
    durationInDays: '7'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Smart contract deployed! Now implement the actual contract interaction.');
  };

  const calculateTotal = () => {
    const reward = Number(formData.rewardPerTask) || 0;
    const completions = Number(formData.maxCompletions) || 0;
    return reward * completions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      {!isConnected ? (
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-8">
            Please connect your wallet to create a campaign
          </p>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Campaign
          </h1>
          <p className="text-gray-600 mb-8">
            Set up a new task campaign and reach your target audience
          </p>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Follow us on Twitter"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what users need to do..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Task Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type *
              </label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.taskType}
                onChange={(e) => setFormData({...formData, taskType: e.target.value})}
              >
                <option value="like">Twitter Like</option>
                <option value="retweet">Twitter Retweet</option>
                <option value="comment">Twitter Comment</option>
                <option value="follow">Twitter Follow</option>
              </select>
            </div>

            {/* Target URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target URL *
              </label>
              <input
                type="url"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://twitter.com/username/status/123..."
                value={formData.targetUrl}
                onChange={(e) => setFormData({...formData, targetUrl: e.target.value})}
              />
            </div>

            {/* Reward and Completions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reward per Task (EPWX) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000000"
                  value={formData.rewardPerTask}
                  onChange={(e) => setFormData({...formData, rewardPerTask: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum: 1 EPWX</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Completions *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                  value={formData.maxCompletions}
                  onChange={(e) => setFormData({...formData, maxCompletions: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">How many users can complete this</p>
              </div>
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Duration (Days) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="90"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.durationInDays}
                onChange={(e) => setFormData({...formData, durationInDays: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">1-90 days</p>
            </div>

            {/* Total Budget */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">Total Budget:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateTotal().toLocaleString()} EPWX
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {formData.rewardPerTask && formData.maxCompletions && 
                  `${formData.rewardPerTask} EPWX × ${formData.maxCompletions} completions`
                }
              </p>
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Note: EPWX has 6% transfer fee. Factor this into your budget.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Campaign
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Connected: {address}
            </p>
          </form>
        </main>
      )}
    </div>
  );
}
