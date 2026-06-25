"use client";
import { Suspense, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useSearchParams } from "next/navigation";
import ReceiptUploadClaim from "../../components/ReceiptUploadClaim";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Haversine formula
  const R = 6371e3; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function ClaimPage() {
  const searchParams = useSearchParams();
  const partnerCode = searchParams.get("partner");
  const merchantId = searchParams.get("merchant") || searchParams.get("merchantId");
  const [merchantLat, setMerchantLat] = useState<number | null>(null);
  const [merchantLng, setMerchantLng] = useState<number | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<any | null>(null);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const { address } = useAccount();
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const pageShellClass = "relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8";
  const centeredMessageClass = "max-w-2xl mx-auto py-16 px-6 text-center";

  useEffect(() => {
    if (!partnerCode || typeof window === "undefined") {
      return;
    }

    const target = `/?partner=${encodeURIComponent(partnerCode)}`;
    window.location.replace(target);
  }, [partnerCode]);

  // Fetch merchant coordinates and info if not present in URL
  useEffect(() => {
    const urlLat = searchParams.get("lat");
    const urlLng = searchParams.get("lng");
    if (urlLat && urlLng && !isNaN(parseFloat(urlLat)) && !isNaN(parseFloat(urlLng))) {
      setMerchantLat(parseFloat(urlLat));
      setMerchantLng(parseFloat(urlLng));
    } else if (merchantId) {
      fetch(`/api/merchants/${merchantId}`)
        .then(res => {
          if (!res.ok) throw new Error("Merchant not found");
          return res.json();
        })
        .then(data => {
          if (typeof data.latitude === "number" && typeof data.longitude === "number") {
            setMerchantLat(data.latitude);
            setMerchantLng(data.longitude);
            setMerchantInfo(data);
          } else {
            setMerchantError("Merchant location not set");
          }
        })
        .catch(() => setMerchantError("Invalid merchant QR code."));
    } else {
      setMerchantError("Invalid merchant QR code.");
    }
  }, [merchantId, searchParams]);

  useEffect(() => {
    if (merchantLat !== null && merchantLng !== null) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocation(pos.coords);
          const d = getDistance(
            pos.coords.latitude,
            pos.coords.longitude,
            merchantLat,
            merchantLng
          );
          setDistance(d);
        },
        err => setGeoError(err.message)
      );
    }
  }, [merchantLat, merchantLng]);

  // ...existing code...

  if (merchantError) {
    return <div className={`${centeredMessageClass} text-red-200`}>{merchantError}</div>;
  }
  if (partnerCode) {
    return <div className={`${centeredMessageClass} text-white/80`}>Redirecting to daily claim...</div>;
  }
  if (merchantLat === null || merchantLng === null) {
    return <div className={`${centeredMessageClass} text-white/80`}>Loading merchant info...</div>;
  }
  const handleRetryLocation = () => {
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation(pos.coords);
        const d = getDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          merchantLat!,
          merchantLng!
        );
        setDistance(d);
      },
      err => setGeoError(err.message)
    );
  };
  if (geoError) {
    return (
      <div className={`${centeredMessageClass} ${pageShellClass} text-white`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
        <div className="text-red-200 font-semibold">Location error: {geoError}</div>
        <span className="block mt-4 text-white/80">
          Please enable GPS/location services on your device and allow location access in your browser settings to claim your reward.
        </span>
        <div className="mt-4 flex flex-col items-center gap-4">
          <img src="/enable-location-example.png" alt="Enable location example (Android)" className="max-w-xs rounded-2xl shadow-2xl border border-white/20" />
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-3 max-w-xs text-left text-sm text-white/90">
            <div className="font-semibold mb-1">iPhone (iOS) instructions:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open the <b>Settings</b> app.</li>
              <li>Tap <b>Privacy & Security</b>.</li>
              <li>Tap <b>Location Services</b>.</li>
              <li>Make sure <b>Location Services</b> is <span className="text-green-700 font-semibold">ON</span>.</li>
              <li>Scroll down, tap your browser (e.g., Safari or Chrome).</li>
              <li>Select <b>While Using the App</b> or <b>Always</b>.</li>
              <li>(Optional) Enable <b>Precise Location</b> for best accuracy.</li>
            </ol>
          </div>
        </div>
        <button
          className="mt-6 px-4 py-2 bg-white/15 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-colors"
          onClick={handleRetryLocation}
        >
          Retry Location
        </button>
        </div>
      </div>
    );
  }
  if (distance === null) {
    return <div className={`${centeredMessageClass} text-white/80`}>Checking your location...</div>;
  }
  if (distance > 50) {
    return <div className={`${centeredMessageClass} text-yellow-200`}>You must be at the merchant location to claim rewards.</div>;
  }
  return (
    <div className="max-w-md mx-auto py-8">
      <div className={pageShellClass}>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
      <h2 className="text-3xl font-black mb-4 text-white text-center">Claim EPWX Reward</h2>
      {!address ? (
        <div className="mb-4 flex flex-col items-center">
          <div className="text-white/80 mb-4">Connect your wallet to claim.</div>
          <div className="mb-4 max-w-sm rounded-2xl border border-white/15 bg-white/10 p-4 text-center text-sm text-white/80">
            Connecting lets EPWX read your public wallet address for eligibility and reward delivery. Connecting does not move funds or grant token spending permissions.
          </div>
          <ConnectKitButton />
        </div>
      ) : (
        <ReceiptUploadClaim 
          merchantId={merchantId} 
          merchantInfo={merchantInfo} 
          wallet={address}
          lat={location?.latitude}
          lng={location?.longitude}
        />
      )}
        </div>
      </div>
    </div>
  );
}

export default function ClaimPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClaimPage />
    </Suspense>
  );
}
