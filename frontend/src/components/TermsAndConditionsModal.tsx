"use client";

type TermsAndConditionsModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function TermsAndConditionsModal({ open, onClose }: TermsAndConditionsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white/95 backdrop-blur-md text-gray-900 dark:bg-gray-900/95 dark:text-gray-100 rounded-2xl shadow-2xl border border-blue-100 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
          onClick={onClose}
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
          <div className="mt-8 flex justify-end not-prose">
            <button
              type="button"
              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
