import React from "react";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <>
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:py-14">
        <main className="mx-auto max-w-4xl">
          <div className="ui-surface-strong p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Platform policy</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Terms and Conditions</h1>
        <p className="mt-4 mb-4 leading-7 text-slate-300">Welcome to EPWX Task Hub. By accessing or using our platform, you agree to these Terms and Conditions. Please read them carefully.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">1. Acceptance of Terms</h2>
        <p className="mb-4">By using EPWX Task Hub, you agree to comply with these Terms and all applicable laws. If you do not agree, do not use the platform.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">2. User Responsibilities</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide accurate, complete, and current information during registration and task submissions.</li>
          <li>Do not engage in fraudulent, abusive, or illegal activities.</li>
          <li>Respect other users, platform administrators, and all applicable laws.</li>
          <li>Maintain the confidentiality of your account credentials and notify us immediately of any unauthorized use.</li>
        </ul>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">3. Prohibited Conduct</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>No use of bots, scripts, or automated methods to access or use the platform.</li>
          <li>No uploading of viruses, malware, or harmful code.</li>
          <li>No attempts to disrupt, damage, or gain unauthorized access to the platform or other users’ accounts.</li>
        </ul>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">4. Platform Rights</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>We may modify, suspend, or terminate the platform or your access at any time, for any reason, without notice.</li>
          <li>We may change these Terms at any time. Continued use constitutes acceptance of the revised Terms.</li>
          <li>We reserve all rights not expressly granted to you.</li>
        </ul>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">5. Intellectual Property</h2>
        <p className="mb-4">All content, trademarks, and data on EPWX Task Hub are the property of their respective owners. You may not copy, modify, or distribute any content without permission.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">6. Limitation of Liability</h2>
        <p className="mb-4">EPWX Task Hub is provided “as is” and “as available.” We disclaim all warranties, express or implied. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">7. Indemnification</h2>
        <p className="mb-4">You agree to indemnify and hold harmless EPWX Task Hub, its affiliates, and staff from any claims, damages, or expenses arising from your use of the platform or violation of these Terms.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">8. Privacy</h2>
        <p className="mb-4">We respect your privacy. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">9. Governing Law</h2>
        <p className="mb-4">These Terms are governed by the laws of the jurisdiction in which EPWX Task Hub operates.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">10. Campaign Participation and Third-Party Platforms</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>You are solely responsible for complying with the rules and policies of any third-party platform used for campaign participation, including X.</li>
          <li>EPWX Task Hub campaigns are not sponsored by, endorsed by, administered by, or associated with X.</li>
          <li>Campaign submissions are subject to manual review and eligibility checks. Rewards are not guaranteed until explicitly approved.</li>
          <li>We may reject, disqualify, or reverse submissions that appear fraudulent, automated, abusive, duplicated, inauthentic, or otherwise non-compliant.</li>
          <li>We may suspend campaign participation privileges for wallets that violate these Terms, campaign rules, or applicable laws.</li>
        </ul>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">11. Contact</h2>
        <p>If you have questions about these Terms, please contact info@epowex.com.</p>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
