"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useSearchParams } from "next/navigation";
import ReceiptUploadClaim from "../../components/ReceiptUploadClaim";

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000,
};

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
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const { address } = useAccount();
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const pageShellClass = "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8";
  const statusViewportClass = "relative min-h-[calc(100vh-5rem)] px-4 py-10";
  const statusCardClass = "mx-auto max-w-2xl rounded-2xl border border-white/15 bg-slate-950/80 px-6 py-5 text-center text-white shadow-xl";
  const glassPanelClass = "rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-lg";

  const requestLocation = useCallback(() => {
    if (merchantLat === null || merchantLng === null) {
      return;
    }

    setGeoError(null);
    setLocation(null);
    setDistance(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location is not available in this browser. Please open the claim link in Chrome or Safari and allow location access.");
      return;
    }

    setIsRequestingLocation(true);
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
        setIsRequestingLocation(false);
      },
      err => {
        setGeoError(err.message || "Unable to read your location. Please enable device location and browser location permission, then retry.");
        setIsRequestingLocation(false);
      },
      GEOLOCATION_OPTIONS
    );
  }, [merchantLat, merchantLng]);

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
      requestLocation();
    }
  }, [merchantLat, merchantLng, requestLocation]);

  // ...existing code...

  if (merchantError) {
    return (
      <div className={`${statusViewportClass} bg-slate-950`}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-blue-600/12 blur-[130px]" />
        </div>
        <div className={`${statusCardClass} text-red-200`}>{merchantError}</div>
      </div>
    );
  }
  if (partnerCode) {
    return (
      <div className={`${statusViewportClass} bg-slate-950`}>
        <div className={`${statusCardClass} text-white/80`}>Redirecting to daily claim...</div>
      </div>
    );
  }
  if (merchantLat === null || merchantLng === null) {
    return (
      <div className={`${statusViewportClass} bg-slate-950`}>
        <div className={`${statusCardClass} text-white/80`}>Loading merchant info...</div>
      </div>
    );
  }
  if (geoError) {
    return (
      <div className={`${statusViewportClass} bg-slate-950 text-white`}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-blue-600/12 blur-[130px]" />
          <div className="absolute bottom-0 left-1/2 h-56 w-[26rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-2xl">
          <div className={pageShellClass}>
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl"></div>
            <div className="relative z-10 text-center">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Merchant Claim</div>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Location access required</h2>
              <div className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">
                Location error: {geoError}
              </div>
              <p className="mt-4 text-sm text-slate-300 sm:text-base">
                Please enable GPS/location services on your device and allow location access in your browser settings to claim your reward.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:items-start">
                <div className={`${glassPanelClass} p-3`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/enable-location-example.png"
                    alt="Enable location example (Android)"
                    className="mx-auto w-full max-w-xs rounded-2xl border border-white/20 shadow-2xl"
                  />
                </div>
                <div className={`${glassPanelClass} p-4 text-left text-sm text-white/90`}>
                  <div className="mb-1 font-semibold text-white">Android instructions:</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Turn on device <b>Location</b> from Quick Settings or Settings.</li>
                    <li>Open <b>Settings</b> and tap <b>Apps</b>.</li>
                    <li>Select your browser, for example <b>Chrome</b>.</li>
                    <li>Tap <b>Permissions</b>, then <b>Location</b>.</li>
                    <li>Choose <b>Allow only while using the app</b>.</li>
                    <li>Return to this page and tap <b>Retry Location</b>.</li>
                  </ol>
                </div>
              </div>

              <button
                className="ui-btn-primary mt-6 rounded-xl px-4 py-2"
                disabled={isRequestingLocation}
                onClick={requestLocation}
              >
                {isRequestingLocation ? "Requesting location..." : "Retry Location"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (distance === null) {
    return (
      <div className={`${statusViewportClass} bg-slate-950`}>
        <div className={`${statusCardClass} text-white/80`}>Checking your location...</div>
      </div>
    );
  }
  if (distance > 50) {
    return (
      <div className={`${statusViewportClass} bg-slate-950`}>
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-300/40 bg-amber-400/15 px-5 py-4 text-amber-100 shadow-sm">
          <p className="text-base font-semibold leading-relaxed sm:text-lg">
            You must be at the merchant location to claim rewards.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-950 px-4 py-8 text-slate-100 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute -right-32 top-16 h-80 w-80 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[150px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-2xl">
      <div className={`${glassPanelClass} mb-4 px-4 py-3 text-xs text-slate-300 sm:text-sm`}>
        <span className="font-semibold text-slate-100">Proximity check:</span> Claims are available only when your current location is within 50m of the merchant location.
      </div>
      <div className={pageShellClass}>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300/10 rounded-full blur-3xl"></div>
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl"></div>
        <div className="relative z-10">
      <div className="mb-6 border-b border-white/10 pb-5 text-center sm:text-left">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Merchant Claim</div>
        <h2 className="mt-2 text-3xl font-black text-white">Claim EPWX Reward</h2>
        <p className="mt-2 text-sm text-slate-300">
          Upload your purchase receipt after the location check passes to submit a merchant cashback claim.
        </p>
      </div>
      {!address ? (
        <div className="mb-4 flex flex-col items-center">
          <div className="mb-4 text-white/80">Connect your wallet to claim.</div>
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
