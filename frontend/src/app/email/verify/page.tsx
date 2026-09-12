"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function VerifyDailyClaimEmailPage() {
  const [message, setMessage] = useState("Verifying your email...");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMessage("This verification link is missing its token.");
      return;
    }

    fetch(`/api/epwx/daily-claim/email/verify?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        setVerified(response.ok && data.success);
        setMessage(data.message || data.error || "Unable to verify this email.");
      })
      .catch(() => setMessage("Unable to verify this email. Please try again."));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <section className="w-full max-w-lg border border-white/15 bg-white/5 p-7 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">EPWX Daily Claims</div>
        <h1 className="mt-3 text-2xl font-black">{verified ? "Email verified" : "Email verification"}</h1>
        <p className="mt-3 text-sm leading-6 text-white/75" role="status">{message}</p>
        <Link href="/#daily-claim" className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400">
          Return to Daily Claim
        </Link>
      </section>
    </main>
  );
}