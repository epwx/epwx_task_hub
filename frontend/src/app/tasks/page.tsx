'use client';

import { Header } from "@/components/Header";
import { TaskList } from "@/components/TaskList";
import { useState } from "react";

export default function TasksPage() {
  const [taskType, setTaskType] = useState<string>('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Available Tasks
          </h1>
          <p className="text-gray-600 text-lg">
            Complete tasks and earn EPWX tokens instantly
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="like">❤️ Like</option>
                <option value="repost">🔄 Repost</option>
                <option value="comment">💬 Comment</option>
                <option value="follow">👤 Follow</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="newest">Newest First</option>
                <option value="reward">Highest Reward</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setTaskType('')}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <TaskList limit={50} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 EPWX Task Platform. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <a href="https://epowex.com" className="hover:text-blue-400">Main Site</a>
            <a href="/terms" className="hover:text-blue-400">Terms</a>
            <a href="/privacy" className="hover:text-blue-400">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
