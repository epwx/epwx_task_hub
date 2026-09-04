import React from "react";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:py-14">
        <main className="mx-auto max-w-4xl">
          <div className="ui-surface-strong p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Platform policy</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 mb-4 leading-7 text-slate-300">EPWX Task Hub is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">1. Information Collection</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>We collect information you provide during registration and task submissions.</li>
          <li>We may collect technical data such as IP address, device information, and usage statistics.</li>
        </ul>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">2. Use of Information</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Your information is used to operate the platform, process rewards, and improve user experience.</li>
          <li>We do not sell or share your personal data with third parties except as required by law or for platform operation.</li>
        </ul>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">3. Data Security</h2>
        <p className="mb-4">We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">4. Cookies</h2>
        <p className="mb-4">EPWX Task Hub may use cookies to enhance your experience. You can disable cookies in your browser settings.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">5. Changes to Policy</h2>
        <p className="mb-4">We may update this Privacy Policy periodically. Continued use of the platform constitutes acceptance of the revised policy.</p>
        <h2 className="mt-8 mb-4 text-xl font-bold text-white">6. Contact</h2>
        <p>If you have questions about this Privacy Policy, please contact info@epowex.com.</p>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
