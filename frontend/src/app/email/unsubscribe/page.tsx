"use client";

import Link from "next/link";
import { useState } from "react";

export default function UnsubscribeDailyClaimEmailPage() {
  const [message, setMessage] = useState("Stop Daily Claim reminders and payment confirmations for this email address.");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const unsubscribe = async () => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMessage("This unsubscribe link is missing its token.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/epwx/daily-claim/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      setComplete(response.ok && data.success);
      setMessage(data.message || data.error || "Unable to unsubscribe.");
    } catch {
      setMessage("Unable to unsubscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <section className="w-full max-w-lg border border-white/15 bg-white/5 p-7 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">EPWX Daily Claims</div>
        <h1 className="mt-3 text-2xl font-black">Email preferences</h1>
        <p className="mt-3 text-sm leading-6 text-white/75" role="status">{message}</p>
        {!complete ? (
          <button type="button" onClick={unsubscribe} disabled={submitting} className="mt-6 rounded-lg bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50">
            {submitting ? "Unsubscribing..." : "Unsubscribe"}
          </button>
        ) : (
          <Link href="/#daily-claim" className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400">
            Return to Daily Claim
          </Link>
        )}
      </section>
    </main>
  );
}