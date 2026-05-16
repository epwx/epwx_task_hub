import React from "react";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        <p className="mb-4">Welcome to EPWX Task Hub. By accessing or using our platform, you agree to these Terms and Conditions. Please read them carefully.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">By using EPWX Task Hub, you agree to comply with these Terms and all applicable laws. If you do not agree, do not use the platform.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">2. User Responsibilities</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide accurate, complete, and current information during registration and task submissions.</li>
          <li>Do not engage in fraudulent, abusive, or illegal activities.</li>
          <li>Respect other users, platform administrators, and all applicable laws.</li>
          <li>Maintain the confidentiality of your account credentials and notify us immediately of any unauthorized use.</li>
        </ul>
        <h2 className="text-xl font-semibold mt-8 mb-4">3. Prohibited Conduct</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>No use of bots, scripts, or automated methods to access or use the platform.</li>
          <li>No uploading of viruses, malware, or harmful code.</li>
          <li>No attempts to disrupt, damage, or gain unauthorized access to the platform or other users’ accounts.</li>
        </ul>
        <h2 className="text-xl font-semibold mt-8 mb-4">4. Platform Rights</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>We may modify, suspend, or terminate the platform or your access at any time, for any reason, without notice.</li>
          <li>We may change these Terms at any time. Continued use constitutes acceptance of the revised Terms.</li>
          <li>We reserve all rights not expressly granted to you.</li>
        </ul>
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
        <p className="mb-4">All content, trademarks, and data on EPWX Task Hub are the property of their respective owners. You may not copy, modify, or distribute any content without permission.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
        <p className="mb-4">EPWX Task Hub is provided “as is” and “as available.” We disclaim all warranties, express or implied. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Indemnification</h2>
        <p className="mb-4">You agree to indemnify and hold harmless EPWX Task Hub, its affiliates, and staff from any claims, damages, or expenses arising from your use of the platform or violation of these Terms.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Privacy</h2>
        <p className="mb-4">We respect your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">9. Governing Law</h2>
        <p className="mb-4">These Terms are governed by the laws of the jurisdiction in which EPWX Task Hub operates.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact</h2>
        <p>If you have questions about these Terms, please contact info@epowex.com.</p>
      </div>
      <Footer />
    </>
  );
}
