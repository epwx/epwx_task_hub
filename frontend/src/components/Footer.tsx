import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-6 border-t mt-12 text-center text-gray-500 text-sm bg-white">
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-2">
        <Link href="https://epowex.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Main Site</Link>
        <span className="hidden md:block text-gray-600">•</span>
        <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
        <span className="hidden md:block text-gray-600">•</span>
        <Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
        <span className="hidden md:block text-gray-600">•</span>
        <Link href="/user-guide" className="hover:text-blue-400 transition-colors">User Guide</Link>
        <span className="hidden md:block text-gray-600">•</span>
        <Link href="https://twitter.com/epowex" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Twitter</Link>
      </div>
      <div className="text-center text-gray-400 text-xs">&copy; {new Date().getFullYear()} EPWX Task Hub. All rights reserved.</div>
    </footer>
  );
}
