"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSignMessage } from "wagmi";

interface EmailPreference {
  enrolled: boolean;
  emailMasked?: string;
  verified?: boolean;
  remindersEnabled?: boolean;
  successEmailsEnabled?: boolean;
  unsubscribed?: boolean;
  canManage?: boolean;
}

export type EmailEligibilityStatus = "unknown" | "unverified" | "verified";

interface DailyClaimEmailSignupProps {
  wallet: string;
  onEligibilityChange?: (status: EmailEligibilityStatus) => void;
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "";
  if (localPart.length <= 2) return `${localPart[0] || "*"}***@${domain}`;
  return `${localPart.slice(0, 2)}${"*".repeat(Math.min(Math.max(localPart.length - 3, 3), 10))}${localPart.slice(-1)}@${domain}`;
}

export default function DailyClaimEmailSignup({ wallet, onEligibilityChange }: DailyClaimEmailSignupProps) {
  const { signMessageAsync } = useSignMessage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [preference, setPreference] = useState<EmailPreference | null>(null);

  const getTodayUtc = () => new Date().toISOString().slice(0, 10);

  const loadStatus = useCallback(async () => {
    const normalizedWallet = wallet.toLowerCase();
    setLoadingStatus(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/epwx/daily-claim/email/eligibility?wallet=${encodeURIComponent(normalizedWallet)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load email preferences.");
      setPreference({ ...data, canManage: false });
      onEligibilityChange?.(data.verified ? "verified" : "unverified");
      setEditingEmail(false);
      if (!data.enrolled) setStatus("No email is linked to this wallet yet.");
    } catch (error) {
      setStatus(error instanceof Error && /rejected|denied/i.test(error.message)
        ? "Wallet signature was cancelled."
        : error instanceof Error ? error.message : "Unable to load email preferences.");
    } finally {
      setLoadingStatus(false);
    }
  }, [onEligibilityChange, wallet]);

  useEffect(() => {
    setEmail("");
    setEditingEmail(false);
    setStatus(null);
    setPreference(null);
    onEligibilityChange?.("unknown");
    void loadStatus();
  }, [loadStatus, onEligibilityChange]);

  const loadPreferenceDetails = async () => {
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
      setPreference({ ...data, canManage: true });
      onEligibilityChange?.(data.verified ? "verified" : "unverified");
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
      setStatus(data.message || data.error || "Unable to start email verification.");
      if (response.ok) {
        setPreference({
          enrolled: true,
          emailMasked: maskEmail(normalizedEmail),
          verified: false,
          remindersEnabled: true,
          successEmailsEnabled: true,
          unsubscribed: false,
          canManage: true,
        });
        setEditingEmail(false);
        onEligibilityChange?.("unverified");
        if (data.emailSent) setEmail("");
      }
    } catch (error) {
      setStatus(error instanceof Error && /rejected|denied/i.test(error.message)
        ? "Wallet signature was cancelled."
        : "Unable to start email verification.");
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

  const showEnrollmentForm = preference !== null && (!preference.enrolled || editingEmail);

  return (
    <div className="border-t border-white/15 pt-4">
      <div className="text-sm font-bold text-white">
        {preference === null
          ? "Daily Claim email status"
          : preference.verified ? "Daily Claim email verified" : "Daily Claim email verification"}
      </div>
      <div className="mt-1 text-sm text-white/70">
        {preference === null
          ? "Check this wallet's verified email before claiming."
          : preference.verified
            ? "This wallet meets the email requirement for Daily Claims."
            : "Verify an email for this wallet before claiming."}
      </div>
      {!preference ? (
        <button
          type="button"
          onClick={loadStatus}
          disabled={loadingStatus || submitting}
          className="mt-3 text-sm font-semibold text-emerald-200 underline hover:text-white disabled:opacity-50"
        >
          {loadingStatus ? "Checking..." : "Check Email Status"}
        </button>
      ) : null}

      {preference?.enrolled && !editingEmail ? (
        <div className="mt-4 rounded-lg border border-white/15 bg-slate-950/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white">{preference.emailMasked || "Email linked to this wallet"}</div>
              <div className={`mt-1 text-xs font-semibold ${preference.verified ? "text-emerald-200" : "text-amber-200"}`}>
                {preference.verified ? "Verified - eligible for Daily Claims" : "Verification pending"}
              </div>
            </div>
            <button type="button" onClick={() => setEditingEmail(true)} className="text-sm font-semibold text-emerald-200 underline hover:text-white">
              Change email
            </button>
          </div>
          {preference.canManage ? <div className="mt-4 grid gap-3">
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
          </div> : null}
          {preference.verified && !preference.canManage ? (
            <button
              type="button"
              onClick={loadPreferenceDetails}
              disabled={loadingStatus || submitting}
              className="mt-3 text-sm font-semibold text-emerald-200 underline hover:text-white disabled:opacity-50"
            >
              {loadingStatus ? "Loading..." : "Manage email settings"}
            </button>
          ) : null}
          {!preference.verified ? <div className="mt-3 text-xs text-white/60">Open the verification email and confirm the address before claiming.</div> : null}
          {!preference.verified ? (
            <button
              type="button"
              onClick={loadStatus}
              disabled={loadingStatus || submitting}
              className="mt-3 text-sm font-semibold text-emerald-200 underline hover:text-white disabled:opacity-50"
            >
              {loadingStatus ? "Checking..." : "I verified my email - refresh status"}
            </button>
          ) : null}
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
              {submitting ? "Signing..." : preference?.enrolled ? "Verify New Email" : "Verify Email to Claim"}
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