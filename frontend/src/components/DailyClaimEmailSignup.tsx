"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSignMessage } from "wagmi";

interface EmailPreference {
  enrolled: boolean;
  emailMasked?: string;
  verified?: boolean;
  remindersEnabled?: boolean;
  successEmailsEnabled?: boolean;
  unsubscribed?: boolean;
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "";
  if (localPart.length <= 2) return `${localPart[0] || "*"}***@${domain}`;
  return `${localPart.slice(0, 2)}${"*".repeat(Math.min(Math.max(localPart.length - 3, 3), 10))}${localPart.slice(-1)}@${domain}`;
}

export default function DailyClaimEmailSignup({ wallet }: { wallet: string }) {
  const { signMessageAsync } = useSignMessage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [preference, setPreference] = useState<EmailPreference | null>(null);

  useEffect(() => {
    setEmail("");
    setEditingEmail(false);
    setStatus(null);
    setPreference(null);
  }, [wallet]);

  const getTodayUtc = () => new Date().toISOString().slice(0, 10);

  const loadStatus = async () => {
    const normalizedWallet = wallet.toLowerCase();
    setLoadingStatus(true);
    setStatus(null);
    try {
      const message = `EPWX Daily Claim Email Status\nWallet: ${normalizedWallet}\nDate: ${getTodayUtc()}`;
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api/epwx/daily-claim/email/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: normalizedWallet, signature }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load email preferences.");
      setPreference(data);
      setEditingEmail(false);
      if (!data.enrolled) setStatus("No email is linked to this wallet yet.");
    } catch (error) {
      setStatus(error instanceof Error && /rejected|denied/i.test(error.message)
        ? "Wallet signature was cancelled."
        : error instanceof Error ? error.message : "Unable to load email preferences.");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedWallet = wallet.toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setSubmitting(true);
    setStatus(null);
    try {
      const todayUtc = getTodayUtc();
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
      if (response.ok) {
        setPreference({
          enrolled: true,
          emailMasked: maskEmail(normalizedEmail),
          verified: false,
          remindersEnabled: true,
          successEmailsEnabled: true,
          unsubscribed: false,
        });
        setEditingEmail(false);
        if (data.emailSent) setEmail("");
      }
    } catch (error) {
      setStatus(error instanceof Error && /rejected|denied/i.test(error.message)
        ? "Wallet signature was cancelled."
        : "Unable to enable email notifications.");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePreferences = async (remindersEnabled: boolean, successEmailsEnabled: boolean) => {
    const normalizedWallet = wallet.toLowerCase();
    setSubmitting(true);
    setStatus(null);
    try {
      const message = `EPWX Daily Claim Email Preferences\nWallet: ${normalizedWallet}\nClaim-ready reminders: ${remindersEnabled}\nPayment confirmations: ${successEmailsEnabled}\nDate: ${getTodayUtc()}`;
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api/epwx/daily-claim/email/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: normalizedWallet, signature, remindersEnabled, successEmailsEnabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update email preferences.");
      setPreference(data.preference);
      setStatus(data.message);
    } catch (error) {
      setStatus(error instanceof Error && /rejected|denied/i.test(error.message)
        ? "Wallet signature was cancelled."
        : error instanceof Error ? error.message : "Unable to update email preferences.");
    } finally {
      setSubmitting(false);
    }
  };

  const showEnrollmentForm = !preference?.enrolled || editingEmail;

  return (
    <div className="border-t border-white/15 pt-4">
      <div className="text-sm font-bold text-white">Daily Claim email alerts</div>
      <div className="mt-1 text-sm text-white/70">Get a reminder when your next claim is ready and a confirmation after payment.</div>
      {!preference ? (
        <button
          type="button"
          onClick={loadStatus}
          disabled={loadingStatus || submitting}
          className="mt-3 text-sm font-semibold text-emerald-200 underline hover:text-white disabled:opacity-50"
        >
          {loadingStatus ? "Checking..." : "View linked email"}
        </button>
      ) : null}

      {preference?.enrolled && !editingEmail ? (
        <div className="mt-4 rounded-lg border border-white/15 bg-slate-950/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white">{preference.emailMasked}</div>
              <div className={`mt-1 text-xs font-semibold ${preference.verified ? "text-emerald-200" : "text-amber-200"}`}>
                {preference.verified ? "Verified" : "Verification pending"}
              </div>
            </div>
            <button type="button" onClick={() => setEditingEmail(true)} className="text-sm font-semibold text-emerald-200 underline hover:text-white">
              Change email
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="flex items-center justify-between gap-4 text-sm text-white/85">
              <span>Claim-ready reminders</span>
              <input
                type="checkbox"
                checked={Boolean(preference.remindersEnabled)}
                disabled={submitting || !preference.verified}
                onChange={(event) => updatePreferences(event.target.checked, Boolean(preference.successEmailsEnabled))}
                className="h-4 w-4 accent-emerald-400"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-white/85">
              <span>Payment confirmations</span>
              <input
                type="checkbox"
                checked={Boolean(preference.successEmailsEnabled)}
                disabled={submitting || !preference.verified}
                onChange={(event) => updatePreferences(Boolean(preference.remindersEnabled), event.target.checked)}
                className="h-4 w-4 accent-emerald-400"
              />
            </label>
          </div>
          {!preference.verified ? <div className="mt-3 text-xs text-white/60">Verify the new email before alerts become active.</div> : null}
        </div>
      ) : null}

      {showEnrollmentForm ? (
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="flex flex-col gap-3 sm:flex-row">
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
              {submitting ? "Signing..." : preference?.enrolled ? "Verify new email" : "Enable alerts"}
            </button>
          </div>
          {editingEmail ? (
            <button type="button" onClick={() => setEditingEmail(false)} className="mt-3 text-sm text-white/65 underline hover:text-white">
              Cancel
            </button>
          ) : null}
        </form>
      ) : null}
      {status ? <div className="mt-3 text-sm text-emerald-100" role="status">{status}</div> : null}
    </div>
  );
}