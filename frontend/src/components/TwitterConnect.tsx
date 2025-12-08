'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function TwitterConnect() {
  const { address } = useAccount();
  const [twitterUsername, setTwitterUsername] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check Twitter connection status on mount and when wallet changes
  useEffect(() => {
    if (address) {
      checkTwitterStatus();
    } else {
      setIsConnected(false);
      setTwitterUsername(null);
      setIsChecking(false);
    }
  }, [address]);

  // Check URL for OAuth callback success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('twitter_connected') === 'true') {
      toast.success('X/Twitter account connected successfully!');
      checkTwitterStatus();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('error') === 'twitter_auth_failed') {
      toast.error('Failed to connect X/Twitter account');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkTwitterStatus = async () => {
    if (!address) return;
    
    setIsChecking(true);
    try {
      const response = await axios.get(`${API_URL}/api/twitter/status/${address}`);
      setIsConnected(response.data.connected);
      setTwitterUsername(response.data.twitterUsername);
    } catch (error) {
      console.error('Error checking Twitter status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnect = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Start OAuth flow - backend will redirect to Twitter
      const response = await axios.post(`${API_URL}/api/twitter/connect/start`, {
        walletAddress: address
      }, {
        withCredentials: true
      });

      // If response contains redirect URL, navigate to it
      if (response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        // Fallback: directly trigger passport authentication
        window.location.href = `${API_URL}/api/twitter/connect/start`;
      }
    } catch (error: any) {
      console.error('Twitter connect error:', error);
      toast.error(error.response?.data?.error || 'Failed to start X/Twitter authentication');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/twitter/disconnect`, {
        walletAddress: address
      });
      
      setIsConnected(false);
      setTwitterUsername(null);
      toast.success('X/Twitter account disconnected');
    } catch (error: any) {
      console.error('Twitter disconnect error:', error);
      toast.error(error.response?.data?.error || 'Failed to disconnect X/Twitter account');
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Connect your wallet to link your X/Twitter account</p>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isConnected && twitterUsername) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">
              𝕏
            </div>
            <div>
              <p className="text-sm text-gray-600">Connected X/Twitter Account</p>
              <p className="text-lg font-bold text-gray-900">@{twitterUsername}</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
        <div className="mt-4 flex items-center text-sm text-green-600">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          You can now submit tasks with this account
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-200 text-gray-600 rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">
            𝕏
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">Connect X/Twitter</p>
            <p className="text-sm text-gray-600">Required to verify task completion</p>
          </div>
        </div>
      </div>
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
      >
        {isLoading ? 'Connecting...' : 'Connect X/Twitter Account'}
      </button>
      <p className="mt-3 text-xs text-gray-500 text-center">
        We'll redirect you to X to authorize access. Your credentials are never stored.
      </p>
    </div>
  );
}
