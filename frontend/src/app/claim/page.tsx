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
    return <div className="py-16 text-center text-red-600">{merchantError}</div>;
  }
  if (merchantLat === null || merchantLng === null) {
    return <div className="py-16 text-center">Loading merchant info...</div>;
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
      <div className="py-16 text-center text-red-600">
        Location error: {geoError}
        <br />
        <span className="block mt-4 text-gray-700">
          Please enable GPS/location services on your device and allow location access in your browser settings to claim your reward.
        </span>
        <div className="mt-4 flex justify-center">
          <img src="/enable-location-example.png" alt="Enable location example" className="max-w-xs rounded shadow" />
        </div>
        <button
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded font-semibold"
          onClick={handleRetryLocation}
        >
          Retry Location
        </button>
      </div>
    );
  }
  if (distance === null) {
    return <div className="py-16 text-center">Checking your location...</div>;
  }
  if (distance > 50) {
    return <div className="py-16 text-center text-yellow-700">You must be at the merchant location to claim rewards.</div>;
  }
  return (
    <div className="max-w-md mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Claim EPWX Reward</h2>
      {!address ? (
        <div className="mb-4">
          <div className="text-gray-700 mb-2">Connect your wallet to claim.</div>
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
  );
}

export default function ClaimPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClaimPage />
    </Suspense>
  );
}
