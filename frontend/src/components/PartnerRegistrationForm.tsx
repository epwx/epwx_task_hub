"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";

interface PartnerRegistrationFormProps {
  walletAddress: string;
  onSuccess: (partner: any) => void;
}

export default function PartnerRegistrationForm({
  walletAddress,
  onSuccess,
}: PartnerRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    telegramChannel: "",
    xProfile: "",
  });
  const [verificationImage, setVerificationImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });

      setVerificationImage(compressedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch {
      toast.error("Image compression failed. Please try another screenshot.");
      setVerificationImage(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Partner name is required");
      return;
    }

    if (!verificationImage) {
      toast.error("Twitter followers screenshot is required");
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("walletAddress", walletAddress);
      formDataToSend.append("telegramChannel", formData.telegramChannel || "");
      formDataToSend.append("xProfile", formData.xProfile || "");
      formDataToSend.append("verificationImage", verificationImage);

      const response = await fetch("/api/partners/register", {
        method: "POST",
        body: formDataToSend,
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok || !data.success) {
        const errorMessage =
          data?.message ||
          data?.error?.message ||
          (response.status === 413
            ? "Screenshot is too large. Please upload an image under 8MB."
            : "Failed to register partner");
        toast.error(errorMessage);
        return;
      }

      toast.success("Partner application submitted! Awaiting admin verification.");
      onSuccess(data.partner);
      setFormData({ name: "", telegramChannel: "", xProfile: "" });
      setVerificationImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred while registering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h2 className="mb-6 text-2xl font-bold text-white">Apply for Partnership</h2>

        {/* Partner Name */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300">
            Partner Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., My DAO, Community X"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            Your partner name as it will appear in campaigns
          </p>
        </div>

        {/* Twitter Followers Screenshot */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300">
            Twitter Followers Screenshot *
          </label>
          <div className="mt-2 space-y-3">
            {previewUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 rounded-lg border border-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVerificationImage(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-600 p-6 text-center hover:border-cyan-500/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="verification-image"
                />
                <label
                  htmlFor="verification-image"
                  className="cursor-pointer text-sm text-slate-300"
                >
                  <p className="font-semibold">Click to upload screenshot</p>
                  <p className="mt-1 text-xs text-slate-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </label>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Upload a screenshot showing your Twitter account followers count for verification
          </p>
        </div>

        {/* Telegram Channel */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300">
            Telegram Channel (Optional)
          </label>
          <input
            type="text"
            name="telegramChannel"
            value={formData.telegramChannel}
            onChange={handleChange}
            placeholder="e.g., @my_community"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Your primary Telegram channel for campaign announcements
          </p>
        </div>

        {/* X Profile */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300">
            X/Twitter Profile (Optional)
          </label>
          <input
            type="text"
            name="xProfile"
            value={formData.xProfile}
            onChange={handleChange}
            placeholder="e.g., @my_account"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Your X/Twitter profile for cross-platform campaigns
          </p>
        </div>

        {/* Wallet Info */}
        <div className="mb-8 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-sm text-slate-300">
            <span className="font-semibold">Wallet:</span> {walletAddress}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Partner rewards will be sent to this wallet
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h3 className="mb-3 font-semibold text-slate-200">Verification Process:</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li>• Upload a screenshot of your Twitter followers count</li>
          <li>• Admin will review your application within 24 hours</li>
          <li>• Once approved, you can immediately start earning</li>
          <li>• Earn 100,000 EPWX per verified user daily claim</li>
          <li>• Earnings are settled after 7-day verification hold</li>
        </ul>
      </div>

      {/* Post-submit info */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
        <p className="text-sm font-semibold text-amber-200">What happens after submission</p>
        <p className="mt-1 text-xs text-amber-200/80">
          After you submit the form, your application moves to pending verification until an admin reviews it.
        </p>
      </div>
    </form>
  );
}
