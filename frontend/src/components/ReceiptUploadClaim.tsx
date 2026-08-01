import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';

interface MerchantInfo {
  name?: string;
  address?: string;
  [key: string]: any;
}

interface ReceiptUploadClaimProps {
  merchantId: string | number | null;
  merchantInfo?: MerchantInfo | null;
  wallet?: string;
  lat?: number | null;
  lng?: number | null;
}

const ReceiptUploadClaim: React.FC<ReceiptUploadClaimProps> = ({ merchantId, merchantInfo, wallet, lat, lng }) => {
    const glassPanelClass = 'rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-lg';
    // Display merchant info if available
    const renderMerchantInfo = () => {
      if (!merchantInfo) return null;
      return (
        <div className={`${glassPanelClass} mb-4 p-4`}>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Merchant</div>
          <div className="mt-2 text-lg font-black text-white">{merchantInfo.name}</div>
          <div className="mt-1 text-sm text-slate-300">{merchantInfo.address}</div>
        </div>
      );
    };
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(false);
    setError('');

    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file.');
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
      setError('Image compression failed. Please try another receipt image.');
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a receipt image.');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('merchantId', merchantId ? String(merchantId) : '');
    formData.append('customer', wallet || '');
    if (lat !== undefined && lat !== null) formData.append('lat', String(lat));
    if (lng !== undefined && lng !== null) formData.append('lng', String(lng));
    formData.append('receiptImage', file);
    try {
      const res = await fetch('/api/claims/add', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setFile(null);
      } else {
        setError(data.error || 'Submission failed.');
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left text-white">
      {renderMerchantInfo()}
      <div className={`${glassPanelClass} p-4`}>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Receipt Upload</div>
        <h2 className="mt-2 text-xl font-black text-white">Upload store receipt</h2>
        <p className="mt-2 text-sm text-slate-300">
          Submit a clear receipt image to verify your in-store purchase and unlock the merchant reward.
        </p>
      </div>
      <label className={`${glassPanelClass} block cursor-pointer p-4 transition-colors hover:bg-white/[0.07]`}>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Receipt image</div>
        <div className="mt-2 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">
          Choose image
        </div>
        <div className="mt-3 text-sm text-slate-300">PNG, JPG, or WEBP. Large images are compressed automatically before upload.</div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>
      {file && (
        <div className={`${glassPanelClass} p-4`}>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Selected file</div>
          <div className="mt-2 break-all text-sm font-semibold text-white">{file.name}</div>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="ui-btn-primary w-full rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Submitting...' : 'Submit Claim'}
      </button>
      {success && <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">Claim submitted successfully!</div>}
      {error && <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
    </form>
  );
};

export default ReceiptUploadClaim;
