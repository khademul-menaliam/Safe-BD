"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const EMPTY_FORM = {
  fullName: "", nickname: "", age: "", gender: "Female", phone: "", alternatePhone: "",
  lastSeenLocation: "", lastSeenDate: "", lastSeenTime: "", clothingDescription: "",
  physicalDescription: "", medicalNotes: "", additionalInfo: "",
  reporterRelationship: "", reporterPhone: "", reporterEmail: "",
};

export default function ReportMissingPersonPage() {
  const { status } = useSession();
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);

  function update<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUpgradeRequired(false);

    if (status !== "authenticated") {
      setError("Please log in to submit a missing-person report.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append("photo", photo);

      const res = await fetch("/api/cases", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (data.upgradeRequired) setUpgradeRequired(true);
        return;
      }
      setCaseNumber(data.caseNumber);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (caseNumber) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/15">✓</div>
          <h1 className="text-xl font-bold text-navy-950">Case reported</h1>
          <p className="mt-2 text-sm text-gray-600">Your case has been created. Please upload the GD document next to move the case toward verification.</p>
          <div className="mt-4 rounded-lg bg-navy-950/[0.04] px-4 py-3 font-mono text-lg font-bold text-navy-900">{caseNumber}</div>
          <Link href={`/cases/${caseNumber}`} className="btn-primary mt-6 w-full">Continue to Upload GD Copy</Link>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-navy-950">Please log in first</h1>
        <p className="mt-2 text-sm text-gray-600">You need an account to report a missing person and track the case.</p>
        <Link href="/register" className="btn-primary mt-5 inline-flex">Create an account</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Report a Missing Person</h1>
      <p className="mt-1 text-sm text-gray-600">Fill in as much detail as you can. You&apos;ll be asked to upload the GD copy next.</p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-6" encType="multipart/form-data">
        {error && (
          <div className="rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">
            {error}
            {upgradeRequired && (
              <div className="mt-2">
                <Link href="/pricing" className="font-semibold underline">View plans &amp; pricing →</Link>
              </div>
            )}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="font-semibold text-navy-950">Missing person details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Full name</label><input className="input" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></div>
            <div><label className="label">Nickname</label><input className="input" value={form.nickname} onChange={(e) => update("nickname", e.target.value)} /></div>
            <div><label className="label">Age</label><input className="input" type="number" required min={0} max={130} value={form.age} onChange={(e) => update("age", e.target.value)} /></div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option>Female</option><option>Male</option><option>Other</option>
              </select>
            </div>
            <div><label className="label">Phone number (if any)</label><input className="input" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
            <div><label className="label">Alternative phone number</label><input className="input" value={form.alternatePhone} onChange={(e) => update("alternatePhone", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">Photograph</label><input className="input" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-navy-950">Last seen</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label">Last seen location</label><input className="input" required value={form.lastSeenLocation} onChange={(e) => update("lastSeenLocation", e.target.value)} /></div>
            <div><label className="label">Last seen date</label><input className="input" type="date" required value={form.lastSeenDate} onChange={(e) => update("lastSeenDate", e.target.value)} /></div>
            <div><label className="label">Last seen time</label><input className="input" type="time" value={form.lastSeenTime} onChange={(e) => update("lastSeenTime", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">Clothing description</label><textarea className="input" rows={2} value={form.clothingDescription} onChange={(e) => update("clothingDescription", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">Physical description</label><textarea className="input" rows={2} value={form.physicalDescription} onChange={(e) => update("physicalDescription", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">Medical / emergency notes</label><textarea className="input" rows={2} value={form.medicalNotes} onChange={(e) => update("medicalNotes", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">Additional information</label><textarea className="input" rows={3} value={form.additionalInfo} onChange={(e) => update("additionalInfo", e.target.value)} /></div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-navy-950">Reporter details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Your relationship to them</label><input className="input" required placeholder="e.g. Mother, Brother" value={form.reporterRelationship} onChange={(e) => update("reporterRelationship", e.target.value)} /></div>
            <div><label className="label">Your phone number</label><input className="input" required placeholder="01XXXXXXXXX" value={form.reporterPhone} onChange={(e) => update("reporterPhone", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">Your email (optional)</label><input className="input" type="email" value={form.reporterEmail} onChange={(e) => update("reporterEmail", e.target.value)} /></div>
          </div>
        </fieldset>

        <button type="submit" disabled={loading} className="btn-danger w-full !py-3.5 text-base">{loading ? "Submitting…" : "Submit Report"}</button>
      </form>
    </div>
  );
}
