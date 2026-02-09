"use client";
import React, { useEffect, useState } from "react";

export default function TermsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const accepted = localStorage.getItem("epwx_terms_accepted");
      if (!accepted) setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("epwx_terms_accepted", "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-bold mb-4">Terms of Service</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-200">
          Please review and accept our <a href="/terms" className="text-blue-600 underline">Terms of Service</a> to continue using EPWX Task Hub.
        </p>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded"
          onClick={handleAccept}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
