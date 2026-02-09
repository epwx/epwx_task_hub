import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-6 border-t mt-12 text-center text-gray-800 bg-white dark:bg-gray-950 dark:text-gray-200">
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-2">
        <a href="https://epowex.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Main Site</a>
        <span className="hidden md:block text-gray-600 dark:text-gray-400">•</span>
        <a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a>
        <span className="hidden md:block text-gray-600 dark:text-gray-400">•</span>
        <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
        <span className="hidden md:block text-gray-600 dark:text-gray-400">•</span>
        <a href="/user-guide" className="hover:text-blue-400 transition-colors">User Guide</a>
        <span className="hidden md:block text-gray-600 dark:text-gray-400">•</span>
        <a href="https://twitter.com/epowex" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Twitter</a>
      </div>
      <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
        <p>&copy; 2026 EPWX Task Hub. All rights reserved.</p>
      </div>
    </footer>
  );
}
