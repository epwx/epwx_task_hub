"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useSearchParams } from "next/navigation";

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

export default function ClaimPage() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get("merchant");
  const merchantLat = parseFloat(searchParams.get("lat") || "");
  const merchantLng = parseFloat(searchParams.get("lng") || "");
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [distance, setDistance] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const { address } = useAccount();
  const [form, setForm] = useState({ bill: "" });
  const [claimStatus, setClaimStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (merchantLat && merchantLng) {
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

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setClaimStatus(null);
    try {
      const res = await fetch("/api/claims/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          bill: form.bill,
          customer: address,
          lat: location.latitude,
          lng: location.longitude,
        }),
      });
      const data = await res.json();
      if (data.success) setClaimStatus("Claim submitted successfully!");
      else setClaimStatus(data.error || "Failed to submit claim");
    } catch (e) {
      setClaimStatus(e.message || "Failed to submit claim");
    }
    setLoading(false);
  };

  if (!merchantId || isNaN(merchantLat) || isNaN(merchantLng)) {
    return <div className="py-16 text-center text-red-600">Invalid merchant QR code.</div>;
  }

  if (geoError) {
    return <div className="py-16 text-center text-red-600">Location error: {geoError}</div>;
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
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
          <input name="bill" value={form.bill} onChange={handleChange} placeholder="Bill Amount (optional)" className="w-full border rounded px-3 py-2 text-gray-700" />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold" disabled={loading}>{loading ? "Submitting..." : "Submit Claim"}</button>
          {claimStatus && <div className="mt-2 text-green-600">{claimStatus}</div>}
        </form>
      )}
    </div>
  );
}
