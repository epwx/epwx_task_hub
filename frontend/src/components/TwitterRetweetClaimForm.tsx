import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';

interface TwitterRetweetClaimFormProps {
  wallet?: string;
  twitterCampaignId: number;
  campaignCode: string;
  title: string;
  rewardAmount?: string | null;
  claimStatus?: 'pending' | 'paid' | null;
}

const TwitterRetweetClaimForm: React.FC<TwitterRetweetClaimFormProps> = ({ wallet, twitterCampaignId, campaignCode, title, rewardAmount, claimStatus }) => {
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
      setError('Please upload your retweet screenshot.');
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
      const response = await fetch('/api/claims/twitter-retweet', {
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
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white backdrop-blur-xl shadow-2xl">
      <div className="mb-5 rounded-2xl border border-white/15 bg-black/10 p-4">
        <div className="text-xs uppercase tracking-[0.25em] text-white/60">Twitter reward claim</div>
        <h2 className="mt-2 text-2xl font-black">{title || 'Upload your retweet screenshot'}</h2>
        <p className="mt-2 text-sm text-white/75">
          After you retweet the post, upload a clear screenshot here. Admin will review it and either distribute EPWX or reject it with a reason.
        </p>
        <div className="mt-3 text-sm text-white/70">Campaign: {campaignCode}</div>
        <div className="mt-1 text-sm text-white/70">Reward: {Number(rewardAmount || '100000').toLocaleString()} EPWX</div>
      </div>

        {claimStatus === 'pending' ? (
          <div className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-400/15 p-4 text-sm text-amber-100">
            You already submitted this retweet screenshot. Your claim is pending admin review, so no new upload is needed right now.
          </div>
        ) : null}

      <label className="mb-2 block text-sm font-semibold text-white/85">Twitter username (optional)</label>
      <input
        type="text"
        value={twitterUsername}
        onChange={(event) => setTwitterUsername(event.target.value)}
        placeholder="@yourhandle"
          disabled={claimStatus === 'pending'}
        className="mb-4 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:border-emerald-300 focus:outline-none"
      />

      <label className="mb-2 block text-sm font-semibold text-white/85">Retweet screenshot</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={claimStatus === 'pending'}
        className="mb-3 block w-full text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white/15 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-white/20"
      />
      {file ? <div className="mb-4 text-sm text-white/80">Selected file: {file.name}</div> : null}

      <label className="mb-5 flex items-start gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          disabled={claimStatus === 'pending'}
          className="mt-1"
        />
        <span>I confirm this screenshot is from my own retweet and I understand the claim will be manually reviewed.</span>
      </label>

      <button
        type="submit"
        disabled={claimStatus === 'pending' || loading || !agreed}
        className={`w-full rounded-2xl px-4 py-3 font-bold text-white ${claimStatus === 'pending' || loading || !agreed ? 'cursor-not-allowed bg-white/10 opacity-50' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {claimStatus === 'pending' ? 'Claim Pending Review' : loading ? 'Submitting...' : 'Submit Twitter Claim'}
      </button>

      {success ? <div className="mt-4 text-sm text-emerald-200">Your screenshot was submitted and is now pending admin approval.</div> : null}
      {error ? <div className="mt-4 text-sm text-red-200">{error}</div> : null}
    </form>
  );
};

export default TwitterRetweetClaimForm;