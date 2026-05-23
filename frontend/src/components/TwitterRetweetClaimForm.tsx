import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';

interface TwitterRetweetClaimFormProps {
  wallet?: string;
  campaignCode?: string | null;
  title?: string | null;
}

const TwitterRetweetClaimForm: React.FC<TwitterRetweetClaimFormProps> = ({ wallet, campaignCode, title }) => {
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
    formData.append('campaignCode', campaignCode || 'twitter-retweet');
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
        <div className="mt-3 text-sm text-white/70">Campaign: {campaignCode || 'twitter-retweet'}</div>
      </div>

      <label className="mb-2 block text-sm font-semibold text-white/85">Twitter username (optional)</label>
      <input
        type="text"
        value={twitterUsername}
        onChange={(event) => setTwitterUsername(event.target.value)}
        placeholder="@yourhandle"
        className="mb-4 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:border-cyan-300 focus:outline-none"
      />

      <label className="mb-2 block text-sm font-semibold text-white/85">Retweet screenshot</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-3 block w-full text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white/15 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-white/20"
      />
      {file ? <div className="mb-4 text-sm text-white/80">Selected file: {file.name}</div> : null}

      <label className="mb-5 flex items-start gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-1"
        />
        <span>I confirm this screenshot is from my own retweet and I understand the claim will be manually reviewed.</span>
      </label>

      <button
        type="submit"
        disabled={loading || !agreed}
        className={`w-full rounded-2xl border border-cyan-200/40 px-4 py-3 font-bold text-white ${loading || !agreed ? 'cursor-not-allowed bg-white/10 opacity-50' : 'bg-cyan-500/30 hover:bg-cyan-500/40'}`}
      >
        {loading ? 'Submitting...' : 'Submit Twitter Claim'}
      </button>

      {success ? <div className="mt-4 text-sm text-emerald-200">Your screenshot was submitted and is now pending admin approval.</div> : null}
      {error ? <div className="mt-4 text-sm text-red-200">{error}</div> : null}
    </form>
  );
};

export default TwitterRetweetClaimForm;