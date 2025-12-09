'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TwitterConnect } from './TwitterConnect';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TaskSubmissionModalProps {
  campaignId: number;
  taskType: string;
  targetUrl: string;
  reward: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskSubmissionModal({
  campaignId,
  taskType,
  targetUrl,
  reward,
  onClose,
  onSuccess
}: TaskSubmissionModalProps) {
  const { address } = useAccount();
  const [twitterUsername, setTwitterUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingTwitter, setCheckingTwitter] = useState(true);
  const [isTwitterConnected, setIsTwitterConnected] = useState(false);
  const [verifiedTwitterUsername, setVerifiedTwitterUsername] = useState<string | null>(null);

  useEffect(() => {
    checkTwitterStatus();
    // Also check on URL change (OAuth callback)
    const params = new URLSearchParams(window.location.search);
    if (params.get('twitter_connected') === 'true') {
      checkTwitterStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [address]);

  const checkTwitterStatus = async () => {
    if (!address) return;
    
    setCheckingTwitter(true);
    try {
      const response = await axios.get(`${API_URL}/api/twitter/status/${address}`);
      if (response.data.success) {
        setIsTwitterConnected(response.data.connected);
        setVerifiedTwitterUsername(response.data.twitterUsername);
        if (response.data.connected && response.data.twitterUsername) {
          setTwitterUsername(response.data.twitterUsername);
        }
      }
    } catch (error) {
      console.error('Error checking Twitter status:', error);
    } finally {
      setCheckingTwitter(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!twitterUsername.trim()) {
      toast.error('Please enter your Twitter username');
      return;
    }

    const cleanUsername = twitterUsername.trim().replace(/^@/, '');

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/tasks/submit`,
        {
          campaignId,
          walletAddress: address,
          taskType,
          targetUrl,
          twitterUsername: cleanUsername
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Task verified and submitted successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.data.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please sign in.');
      } else if (error.response?.status === 400) {
        const message = error.response.data.message || error.response.data.error;
        toast.error(message);
      } else {
        toast.error('Failed to verify task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTaskIcon = () => {
    switch (taskType.toLowerCase()) {
      case 'like': return '❤️';
      case 'follow': return '👥';
      case 'retweet':
      case 'share': return '🔄';
      case 'comment': return '💬';
      default: return '✨';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span>{getTaskIcon()}</span>
                <span>Complete Task</span>
              </h2>
              <p className="text-blue-100">
                {taskType.charAt(0).toUpperCase() + taskType.slice(1)} Campaign #{campaignId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Reward Display */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-semibold mb-1">Reward</p>
                <p className="text-2xl font-black text-green-700">{reward} EPWX</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Twitter Connection Check */}
          {checkingTwitter ? (
            <div className="bg-gray-50 rounded-xl p-6 mb-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : !isTwitterConnected ? (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-yellow-800 font-semibold mb-1">🔐 X/Twitter Connection Required</p>
                <p className="text-xs text-yellow-700">
                  You must connect your X/Twitter account to verify task ownership and prevent fraud.
                </p>
              </div>
              <TwitterConnect />
            </div>
          ) : null}

          {/* Instructions */}
          {isTwitterConnected && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">How it works:</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Complete the task on X/Twitter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Click the task link below to perform the action</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>We verify instantly with your verified X account (@{verifiedTwitterUsername})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>EPWX sent automatically to your wallet!</span>
                </li>
              </ol>
            </div>
          )}

          {/* Task URL */}
          {isTwitterConnected && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Task Link</p>
                  <p className="text-sm text-blue-900 font-medium truncate">{targetUrl}</p>
                </div>
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          )}

          {/* Form */}
          {isTwitterConnected && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Verified X/Twitter Account
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400 font-semibold text-lg">@</span>
                  <input
                    type="text"
                    value={twitterUsername}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl text-lg cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-3.5 text-green-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  ✅ Verified account - ready to submit tasks!
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  💡 <strong>Automatic verification</strong> - no screenshots needed!
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !twitterUsername.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Get Reward</span>
                    <span className="text-xl">→</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
