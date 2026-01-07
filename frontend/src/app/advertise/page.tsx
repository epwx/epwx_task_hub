'use client';

import { Header } from "@/components/Header";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { parseUnits } from "viem";

const TASK_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_TASK_MANAGER as `0x${string}`;
const EPWX_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`;

const ERC20_ABI = [
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const TASK_MANAGER_ABI = [
  {
    "inputs": [
      {"name": "_taskType", "type": "string"},
      {"name": "_targetUrl", "type": "string"},
      {"name": "_rewardPerTask", "type": "uint256"},
      {"name": "_maxCompletions", "type": "uint256"},
      {"name": "_duration", "type": "uint256"}
    ],
    "name": "createCampaign",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract: approveToken } = useWriteContract();

  const { data: allowance } = useReadContract({
    address: EPWX_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, TASK_MANAGER_ADDRESS] : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !isConnected) return;

    setIsSubmitting(true);

    try {
      const rewardPerTask = parseUnits(formData.rewardPerTask, 9); // EPWX has 9 decimals
      const maxCompletions = BigInt(formData.maxCompletions);
      const totalAmount = rewardPerTask * maxCompletions;
      if (!allowance || allowance < totalAmount) {
        alert('Step 1/2: Approve EPWX spending...');
        
        approveToken({
          address: EPWX_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [TASK_MANAGER_ADDRESS, totalAmount],
        }, {
          onSuccess: () => {
            alert('Approval successful! Now creating campaign...');
            setTimeout(() => createCampaignOnChain(), 2000);
          },
          onError: (error) => {
            alert('Approval failed: ' + error.message);
            setIsSubmitting(false);
          }
        });
      } else {
        createCampaignOnChain();
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
      setIsSubmitting(false);
    }
  };

  const createCampaignOnChain = () => {
    const rewardPerTask = parseUnits(formData.rewardPerTask, 9);
    const maxCompletions = BigInt(formData.maxCompletions);
    const durationInDays = BigInt(formData.durationInDays); // Contract expects days, not seconds

    createCampaign({
      address: TASK_MANAGER_ADDRESS,
      abi: TASK_MANAGER_ABI,
      functionName: 'createCampaign',
      args: [formData.taskType, formData.targetUrl, rewardPerTask, maxCompletions, durationInDays],
    }, {
      onSuccess: async (hash) => {
        // Save campaign details to backend
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              creator: address,
              transactionHash: hash,
            }),
          });
        } catch (err) {
          console.error('Failed to save to backend:', err);
        }

        alert('Campaign created successfully! Transaction: ' + hash);
        setFormData({
          title: '',
          description: '',
          taskType: 'like',
          targetUrl: '',
          rewardPerTask: '',
          maxCompletions: '',
          durationInDays: '7'
        });
        setIsSubmitting(false);
      },
      onError: (error) => {
        alert('Campaign creation failed: ' + error.message);
        setIsSubmitting(false);
      }
    });
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
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
