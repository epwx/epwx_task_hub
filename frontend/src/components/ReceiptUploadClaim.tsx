import React, { useState } from 'react';
import termsContent from '../app/terms/page';
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
    // Display merchant info if available
    const renderMerchantInfo = () => {
      if (!merchantInfo) return null;
      return (
        <div className="mb-4 p-2 border rounded bg-gray-50">
          <div className="font-semibold text-gray-800">Merchant:</div>
          <div className="text-gray-900 font-medium">{merchantInfo.name}</div>
          <div className="text-sm text-gray-700">{merchantInfo.address}</div>
        </div>
      );
    };
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(false);
    setError('');
    const selectedFile = e.target.files && e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }
    // Compress image if it's over 800KB or always compress for consistency
    try {
      const options = {
        maxSizeMB: 0.8, // 800KB
        maxWidthOrHeight: 1280,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(selectedFile, options);
      setFile(compressedFile);
    } catch (err) {
      setError('Image compression failed. Please try another image.');
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
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-white max-w-md mx-auto">
      {renderMerchantInfo()}
      <h2 className="text-lg font-bold mb-2 text-gray-900">Upload Store Receipt</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-2"
      />
      {file && (
        <div className="mb-2 text-gray-900 font-medium break-all">Selected file: {file.name}</div>
      )}
      <div className="flex items-center mb-4 mt-2">
        <input
          id="terms-checkbox"
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="terms-checkbox" className="text-sm text-gray-700">
          I agree to the{' '}
          <button
            type="button"
            className="underline text-blue-600 hover:text-blue-800"
            onClick={() => setShowTerms(true)}
          >
            terms and conditions
          </button>
        </label>
      </div>
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={() => setShowTerms(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
              <p className="mb-4">Welcome to EPWX Task Hub. Please read these Terms of Service carefully before using our platform.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
              <p className="mb-4">By accessing or using EPWX Task Hub, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">2. User Responsibilities</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide accurate information during registration and task submissions.</li>
                <li>Do not engage in fraudulent or abusive activities.</li>
                <li>Respect other users and platform administrators.</li>
              </ul>
              <h2 className="text-lg font-semibold mt-6 mb-2">3. Platform Usage</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>EPWX Task Hub reserves the right to modify, suspend, or terminate services at any time.</li>
                <li>Rewards and campaigns are subject to change without prior notice.</li>
              </ul>
              <h2 className="text-lg font-semibold mt-6 mb-2">4. Limitation of Liability</h2>
              <p className="mb-4">EPWX Task Hub is not liable for any losses or damages resulting from the use of the platform.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">5. Changes to Terms</h2>
              <p className="mb-4">We may update these Terms of Service periodically. Continued use of the platform constitutes acceptance of the revised terms.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">6. Contact</h2>
              <p>If you have questions about these Terms, please contact info@epowex.com.</p>
            </div>
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !agreed}
        className={`bg-blue-600 text-white px-4 py-2 rounded ${(!agreed || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Submitting...' : 'Submit Claim'}
      </button>
      {success && <div className="text-green-600 mt-2">Claim submitted successfully!</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
};

export default ReceiptUploadClaim;
