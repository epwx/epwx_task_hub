"use client";

import { FormEvent, useState } from "react";
import { useSignMessage } from "wagmi";

export default function DailyClaimEmailSignup({ wallet }: { wallet: string }) {
  const { signMessageAsync } = useSignMessage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedWallet = wallet.toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setSubmitting(true);
    setStatus(null);
    try {
      const todayUtc = new Date().toISOString().slice(0, 10);
      const message = `EPWX Daily Claim Email Enrollment\nWallet: ${normalizedWallet}\nEmail: ${normalizedEmail}\nDate: ${todayUtc}`;
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api/epwx/daily-claim/email/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: normalizedWallet,
          email: normalizedEmail,
          signature,
          remindersEnabled: true,
          successEmailsEnabled: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
      });
      const data = await response.json();
      setStatus(data.message || data.error || "Unable to enable email notifications.");
      if (response.ok && data.emailSent) setEmail("");
    } catch (error) {
      setStatus(error instanceof Error && /rejected|denied/i.test(error.message)
        ? "Wallet signature was cancelled."
        : "Unable to enable email notifications.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 border-t border-white/15 pt-4">
      <div className="text-sm font-bold text-white">Daily Claim email alerts</div>
      <div className="mt-1 text-sm text-white/70">Get a reminder when your next claim is ready and a confirmation after payment.</div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="daily-claim-email" className="sr-only">Email address</label>
        <input
          id="daily-claim-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={submitting}
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-300"
        />
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Signing..." : "Enable alerts"}
        </button>
      </div>
      {status ? <div className="mt-3 text-sm text-emerald-100" role="status">{status}</div> : null}
    </form>
  );
}