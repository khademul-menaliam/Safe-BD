"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import MapView from "@/components/MapViewClient";

const DURATIONS = [
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "Until stopped", minutes: undefined },
];

export default function SafetyPage() {
  const { status } = useSession();
  const [sharing, setSharing] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [sosResult, setSosResult] = useState<{ notified: { name: string; phone: string }[]; demo: boolean } | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, []);

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) { reject(new Error("Geolocation is not supported by your browser.")); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  async function startSharing(minutes?: number) {
    setError(null);
    try {
      const pos = await getPosition();
      const { latitude, longitude, accuracy } = pos.coords;
      const res = await fetch("/api/location/share", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, accuracyMeters: accuracy, durationMinutes: minutes }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not start sharing."); return; }
      setSharing(true);
      setPosition({ lat: latitude, lng: longitude, accuracy });
      setLastUpdate(new Date());
      setExpiresAt(data.share.expiresAt ? new Date(data.share.expiresAt) : null);

      watchId.current = navigator.geolocation.watchPosition(
        async (p) => {
          setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
          setLastUpdate(new Date());
          await fetch("/api/location/update", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracyMeters: p.coords.accuracy }),
          });
        },
        () => setError("Location permission denied. Please enable location access if you want to share your live location."),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    } catch {
      setError("Location permission denied. Please enable location access if you want to share your live location.");
    }
  }

  async function stopSharing() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    await fetch("/api/location/stop", { method: "POST" });
    setSharing(false);
    setExpiresAt(null);
  }

  async function triggerSOS() {
    if (!confirm("This will alert your trusted contacts and start sharing your location. Continue?")) return;
    setError(null);
    try {
      const pos = await getPosition().catch(() => null);
      const body = pos ? { latitude: pos.coords.latitude, longitude: pos.coords.longitude } : {};
      const res = await fetch("/api/sos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not trigger SOS."); return; }
      setSosActive(true);
      setSosResult({ notified: data.notified, demo: data.demo });
      if (pos) { setSharing(true); setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); }
    } catch {
      setError("Something went wrong triggering SOS.");
    }
  }

  async function resolveSOS() {
    await fetch("/api/sos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "RESOLVED" }) });
    setSosActive(false);
    setSosResult(null);
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-navy-950">Please log in</h1>
        <p className="mt-2 text-sm text-gray-600">Log in or create a safety profile to use live location sharing and SOS.</p>
        <Link href="/register" className="btn-primary mt-5 inline-flex">Create an account</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Live Safety</h1>
      <p className="mt-1 text-sm text-gray-600">Share your location voluntarily, and trigger SOS if you need help.</p>

      {error && <div className="mt-4 rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="card mt-6 flex flex-col items-center py-10 text-center">
        {sosActive ? (
          <>
            <div className="badge bg-brand-red/15 text-red-700 mb-4">SOS ACTIVE</div>
            <p className="max-w-sm text-sm text-gray-600">Your trusted contacts have been notified and your location is being shared.</p>
            {sosResult?.demo && (
              <div className="mt-3 rounded-lg bg-navy-950/5 px-4 py-2 text-xs font-semibold text-navy-800">DEMO NOTIFICATION SENT to {sosResult.notified.length} contact(s)</div>
            )}
            <button onClick={resolveSOS} className="btn-secondary mt-6">Mark as resolved</button>
          </>
        ) : (
          <>
            <button onClick={triggerSOS} className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-red text-2xl font-extrabold text-white shadow-lg transition-transform hover:scale-105">SOS</button>
            <p className="mt-4 max-w-sm text-sm text-gray-500">Tapping SOS alerts your trusted contacts and shares your live location.</p>
          </>
        )}
      </div>

      <div className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-navy-950">Live Location Sharing</h2>
          <span className={`badge ${sharing ? "bg-brand-green/15 text-green-700" : "bg-gray-100 text-gray-600"}`}>{sharing ? "Sharing" : "Not sharing"}</span>
        </div>

        {sharing && position ? (
          <div className="mt-4">
            <MapView latitude={position.lat} longitude={position.lng} label="Your live location" />
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div><dt className="text-gray-500">Latitude</dt><dd>{position.lat.toFixed(5)}</dd></div>
              <div><dt className="text-gray-500">Longitude</dt><dd>{position.lng.toFixed(5)}</dd></div>
              <div><dt className="text-gray-500">Accuracy</dt><dd>{position.accuracy ? `${Math.round(position.accuracy)} m` : "—"}</dd></div>
              <div><dt className="text-gray-500">Last update</dt><dd>{lastUpdate?.toLocaleTimeString() ?? "—"}</dd></div>
            </dl>
            {expiresAt && <p className="mt-2 text-xs text-gray-500">Sharing stops automatically at {expiresAt.toLocaleTimeString()}.</p>}
            <button onClick={stopSharing} className="btn-danger mt-4">Stop Sharing</button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-3">Choose how long to share your live location with trusted contacts:</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => <button key={d.label} onClick={() => startSharing(d.minutes)} className="btn-secondary">{d.label}</button>)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard/trusted-contacts" className="text-sm font-semibold text-navy-800 underline">Manage trusted contacts →</Link>
      </div>
    </div>
  );
}
