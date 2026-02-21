import React, { useState } from 'react';

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
    // Display merchant info if available
    const renderMerchantInfo = () => {
      if (!merchantInfo) return null;
      return (
        <div className="mb-4 p-2 border rounded bg-gray-50">
          <div className="font-semibold">Merchant:</div>
          <div>{merchantInfo.name}</div>
          <div className="text-sm text-gray-600">{merchantInfo.address}</div>
        </div>
      );
    };
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files && e.target.files[0]);
    setSuccess(false);
    setError('');
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
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-white max-w-md mx-auto">
      {renderMerchantInfo()}
      <h2 className="text-lg font-bold mb-2">Upload Store Receipt</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Submitting...' : 'Submit Claim'}
      </button>
      {success && <div className="text-green-600 mt-2">Claim submitted successfully!</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
};

export default ReceiptUploadClaim;
