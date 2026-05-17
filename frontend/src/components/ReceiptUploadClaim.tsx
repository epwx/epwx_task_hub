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
        capture="environment"
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
          <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
              onClick={() => setShowTerms(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="prose max-w-none text-gray-900 dark:text-gray-100">
              <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
              <p className="mb-4">Welcome to EPWX Task Hub. By accessing or using our platform, you agree to these Terms and Conditions. Please read them carefully.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
              <p className="mb-4">By using EPWX Task Hub, you agree to comply with these Terms and all applicable laws. If you do not agree, do not use the platform.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">2. User Responsibilities</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide accurate, complete, and current information during registration and task submissions.</li>
                <li>Do not engage in fraudulent, abusive, or illegal activities.</li>
                <li>Respect other users, platform administrators, and all applicable laws.</li>
                <li>Maintain the confidentiality of your account credentials and notify us immediately of any unauthorized use.</li>
              </ul>
              <h2 className="text-lg font-semibold mt-6 mb-2">3. Prohibited Conduct</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>No use of bots, scripts, or automated methods to access or use the platform.</li>
                <li>No uploading of viruses, malware, or harmful code.</li>
                <li>No attempts to disrupt, damage, or gain unauthorized access to the platform or other users’ accounts.</li>
              </ul>
              <h2 className="text-lg font-semibold mt-6 mb-2">4. Platform Rights</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>We may modify, suspend, or terminate the platform or your access at any time, for any reason, without notice.</li>
                <li>We may change these Terms at any time. Continued use constitutes acceptance of the revised Terms.</li>
                <li>We reserve all rights not expressly granted to you.</li>
              </ul>
              <h2 className="text-lg font-semibold mt-6 mb-2">5. Intellectual Property</h2>
              <p className="mb-4">All content, trademarks, and data on EPWX Task Hub are the property of their respective owners. You may not copy, modify, or distribute any content without permission.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">6. Limitation of Liability</h2>
              <p className="mb-4">EPWX Task Hub is provided “as is” and “as available.” We disclaim all warranties, express or implied. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">7. Indemnification</h2>
              <p className="mb-4">You agree to indemnify and hold harmless EPWX Task Hub, its affiliates, and staff from any claims, damages, or expenses arising from your use of the platform or violation of these Terms.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">8. Privacy</h2>
              <p className="mb-4">We respect your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">9. Governing Law</h2>
              <p className="mb-4">These Terms are governed by the laws of the jurisdiction in which EPWX Task Hub operates.</p>
              <h2 className="text-lg font-semibold mt-6 mb-2">10. Contact</h2>
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
