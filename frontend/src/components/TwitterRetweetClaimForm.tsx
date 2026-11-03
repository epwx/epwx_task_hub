import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';

interface TwitterRetweetClaimFormProps {
  wallet?: string;
  twitterCampaignId: number;
  campaignCode: string;
  title: string;
  taskType: 'retweet' | 'comment' | 'poll' | 'rating';
  rewardAmount?: string | null;
  claimStatus?: 'pending' | 'approved' | 'paid' | 'rejected' | null;
  claimState?: {
    status: string;
    verificationStatus?: string | null;
    verificationDecision?: string | null;
    payoutStatus?: string | null;
    rejectionComment?: string | null;
  } | null;
}

function getTaskLabel(taskType: 'retweet' | 'comment' | 'poll' | 'rating') {
  switch (taskType) {
    case 'comment':
      return 'comment';
    case 'poll':
      return 'poll vote';
    case 'rating':
      return 'rating';
    default:
      return 'repost';
  }
}

const TwitterRetweetClaimForm: React.FC<TwitterRetweetClaimFormProps> = ({ wallet, twitterCampaignId, campaignCode, title, taskType, rewardAmount, claimStatus, claimState }) => {
  const [file, setFile] = useState<File | null>(null);
  const [twitterUsername, setTwitterUsername] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(false);
    setError('');
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    try {
      const compressedFile = await imageCompression(selectedFile, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });
      setFile(compressedFile);
    } catch {
      setError('Image compression failed. Please try another screenshot.');
      setFile(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!wallet) {
      setError('Connect your wallet before submitting a claim.');
      return;
    }

    if (!file) {
      setError(`Please upload your ${getTaskLabel(taskType)} screenshot.`);
      return;
    }
    if (!/^[A-Za-z0-9_]{1,15}$/.test(twitterUsername.trim().replace(/^@/, ''))) {
      setError('Enter the social username shown in your screenshot.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('customer', wallet);
    formData.append('twitterCampaignId', String(twitterCampaignId));
    if (twitterUsername.trim()) {
      formData.append('twitterUsername', twitterUsername.trim().replace(/^@/, ''));
    }
    formData.append('receiptImage', file);

    try {
      const response = await fetch(`/api/claims/twitter-${taskType}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFile(null);
        setTwitterUsername('');
      } else {
        setError(data.error || 'Submission failed.');
      }
    } catch {
      setError('Network error.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="ui-surface-strong p-5 text-white sm:p-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Proof Submission</div>
          <h2 className="mt-2 text-2xl font-black text-white">Upload your {getTaskLabel(taskType)} screenshot</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
          After you complete the task on the selected social platform, upload a clear screenshot here. Admin will review your submission and may approve or reject it based on eligibility and compliance checks.
          </p>
        </div>
        <div className="ui-surface shrink-0 px-4 py-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Campaign</div>
          <div className="mt-1 max-w-48 break-words font-bold text-white">{campaignCode || title}</div>
          <div className="mt-1 font-semibold text-emerald-200">{Number(rewardAmount || '100000').toLocaleString()} EPWX</div>
        </div>
      </div>

      {claimStatus === 'pending' ? (
        <div className="mb-5 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">
          {claimState?.verificationStatus === 'queued' || claimState?.verificationStatus === 'processing'
            ? 'Your screenshot is being analyzed. No new upload is needed.'
            : 'Your screenshot is waiting for manual review. No new upload is needed.'}
        </div>
      ) : null}
      {claimStatus === 'approved' ? (
        <div className="mb-5 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4 text-sm text-cyan-100">
          Your proof is approved. Reward settlement is {claimState?.payoutStatus === 'failed' ? 'waiting for retry' : 'in progress'}.
        </div>
      ) : null}
      {claimStatus === 'paid' ? (
        <div className="mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          Your engagement reward has been paid.
        </div>
      ) : null}
      {claimStatus === 'rejected' ? (
        <div className="mb-5 rounded-2xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">
          This proof was rejected{claimState?.rejectionComment ? `: ${claimState.rejectionComment}` : '.'}
        </div>
      ) : null}

      <label className="mb-2 block text-sm font-bold text-slate-200">Social username</label>
      <input
        type="text"
        value={twitterUsername}
        onChange={(event) => setTwitterUsername(event.target.value)}
        placeholder="@yourhandle"
        disabled={Boolean(claimStatus)}
        className="mb-5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <label className="mb-2 block text-sm font-bold text-slate-200">{taskType === 'comment' ? 'Comment screenshot' : taskType === 'poll' ? 'Poll vote screenshot' : taskType === 'rating' ? 'Rating screenshot' : 'Repost screenshot'}</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={Boolean(claimStatus)}
        className="mb-3 block w-full rounded-xl border border-dashed border-white/15 bg-slate-950/40 p-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400/10 file:px-4 file:py-2 file:font-bold file:text-cyan-100 hover:file:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {file ? <div className="mb-4 text-sm text-cyan-100">Selected file: {file.name}</div> : null}

      <label className="mb-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          disabled={Boolean(claimStatus)}
          className="mt-1 h-4 w-4 accent-emerald-400"
        />
        <span>I confirm this screenshot is from my own account activity, complies with platform rules, and I understand this submission is manually reviewed for eligibility.</span>
      </label>

      <button
        type="submit"
        disabled={Boolean(claimStatus) || loading || !agreed}
        className={`min-h-12 w-full rounded-xl px-4 py-3 font-black transition-colors ${claimStatus || loading || !agreed ? 'cursor-not-allowed border border-white/10 bg-white/[0.04] text-slate-500' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}
      >
        {claimStatus ? `Claim ${claimStatus}` : loading ? 'Submitting...' : 'Submit Proof For Verification'}
      </button>

      {success ? <div className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">Your screenshot was submitted and is now pending admin approval.</div> : null}
      {error ? <div className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div> : null}
    </form>
  );
};

export default TwitterRetweetClaimForm;