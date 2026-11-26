"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import MapView from "@/components/MapViewClient";

export default function CaseDetailsPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) { setData((await res.json()).case); setError(null); }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Could not load this case."); }
    setLoading(false);
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-12 text-sm text-gray-500 sm:px-6">Loading case…</div>;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-navy-950">Case not found</h1>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  const isPrivileged = role === "AUTHORITY" || role === "ADMIN";
  const verifiedGD = data.gdDocuments.find((g: any) => g.status === "VERIFIED");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-sm text-gray-500">{data.caseNumber}</div>
          <h1 className="mt-1 text-2xl font-bold text-navy-950">{data.fullName}</h1>
        </div>
        <StatusBadge status={data.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <h2 className="font-semibold text-navy-950">Missing Person</h2>
            <div className="mt-4 flex gap-4">
              {data.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.photoUrl} alt={data.fullName} className="h-28 w-28 rounded-xl object-cover" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-navy-950/5 text-xs text-gray-400">No photo</div>
              )}
              <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-gray-500">Age</dt><dd>{data.age}</dd></div>
                <div><dt className="text-gray-500">Gender</dt><dd>{data.gender}</dd></div>
                <div><dt className="text-gray-500">Phone</dt><dd>{data.phone ?? "—"}</dd></div>
                <div><dt className="text-gray-500">Last seen</dt><dd>{new Date(data.lastSeenDate).toLocaleDateString()} {data.lastSeenTime ?? ""}</dd></div>
                <div className="col-span-2"><dt className="text-gray-500">Last seen location</dt><dd>{data.lastSeenLocation}</dd></div>
              </dl>
            </div>
            {(data.clothingDescription || data.physicalDescription || data.medicalNotes || data.additionalInfo) && (
              <div className="mt-4 space-y-2 border-t border-navy-900/5 pt-4 text-sm">
                {data.clothingDescription && <p><span className="font-medium text-gray-700">Clothing: </span>{data.clothingDescription}</p>}
                {data.physicalDescription && <p><span className="font-medium text-gray-700">Physical description: </span>{data.physicalDescription}</p>}
                {data.medicalNotes && <p><span className="font-medium text-gray-700">Medical notes: </span>{data.medicalNotes}</p>}
                {data.additionalInfo && <p><span className="font-medium text-gray-700">Additional info: </span>{data.additionalInfo}</p>}
              </div>
            )}
          </div>

          <GDSection caseId={caseId} data={data} isPrivileged={isPrivileged} onChange={load} />
          <LocationSection caseId={caseId} data={data} isPrivileged={isPrivileged} verifiedGD={verifiedGD} onChange={load} />

          {data.gdDocuments.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-navy-950">Documents</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.gdDocuments.map((g: any) => (
                  <li key={g.id} className="flex items-center justify-between rounded-lg bg-navy-950/[0.03] px-3.5 py-2.5">
                    <span>{g.fileName} <span className="text-gray-400">({g.gdNumber})</span></span>
                    <a href={`/api/documents/${g.id}`} target="_blank" rel="noreferrer" className="font-semibold text-navy-800 underline">View</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-navy-950">Timeline</h2>
            <ol className="mt-4 space-y-4 border-l border-navy-900/10 pl-4">
              {data.timeline.map((t: any) => (
                <li key={t.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-navy-700" />
                  <div className="text-sm font-medium text-navy-950">{t.label}</div>
                  {t.description && <div className="text-xs text-gray-500">{t.description}</div>}
                  <div className="mt-0.5 text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="card text-sm">
            <h2 className="font-semibold text-navy-950">Reporter</h2>
            <p className="mt-2 text-gray-600">{data.reporterRelationship}</p>
            <p className="text-gray-600">{data.reporterPhone}</p>
            {data.reporterEmail && <p className="text-gray-600">{data.reporterEmail}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function GDSection({ caseId, data, isPrivileged, onChange }: any) {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ gdNumber: "", policeStation: "", gdFilingDate: "", gdFilingTime: "", reporterName: "", officerName: "" });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasGD = data.gdDocuments.length > 0;

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) { setError("Please attach a file."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v as string));
      fd.append("file", file);
      const res = await fetch(`/api/cases/${caseId}/gd`, { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Upload failed."); return; }
      onChange();
    } finally { setUploading(false); }
  }

  async function verifyAction(gdDocumentId: string, action: "VERIFY" | "REJECT" | "REQUEST_INFO") {
    let reason: string | undefined;
    if (action !== "VERIFY") {
      reason = prompt(action === "REJECT" ? "Reason for rejection:" : "What additional information is needed?") ?? undefined;
      if (!reason) return;
    }
    const res = await fetch(`/api/cases/${caseId}/verify`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gdDocumentId, action, reason }),
    });
    if (res.ok) onChange();
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-navy-950">Upload GD Copy</h2>
      <p className="mt-1 text-sm text-gray-600">Upload a clear copy of the General Diary (GD) filed with Bangladesh Police.</p>

      {data.gdDocuments.map((g: any) => (
        <div key={g.id} className="mt-4 rounded-xl border border-navy-900/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm"><span className="font-medium text-navy-950">GD {g.gdNumber}</span> — {g.policeStation}</div>
            <StatusBadge status={g.status} />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Filed {new Date(g.gdFilingDate).toLocaleDateString()} {g.gdFilingTime ?? ""} · Reporter: {g.reporterName}
            {g.officerName ? ` · Officer: ${g.officerName}` : ""}
          </div>
          {g.rejectionReason && <div className="mt-2 text-sm text-brand-red">Rejected: {g.rejectionReason}</div>}

          {isPrivileged && g.status === "PENDING" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => verifyAction(g.id, "VERIFY")} className="btn-success !py-2 !px-4 text-xs">Verify GD</button>
              <button onClick={() => verifyAction(g.id, "REJECT")} className="btn-danger !py-2 !px-4 text-xs">Reject GD</button>
              <button onClick={() => verifyAction(g.id, "REQUEST_INFO")} className="btn-secondary !py-2 !px-4 text-xs">Request Information</button>
            </div>
          )}
        </div>
      ))}

      {!hasGD && !isPrivileged && (
        <form onSubmit={upload} className="mt-4 space-y-4">
          {error && <div className="rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">GD Number</label><input className="input" required value={form.gdNumber} onChange={(e) => setForm({ ...form, gdNumber: e.target.value })} /></div>
            <div><label className="label">Police Station</label><input className="input" required value={form.policeStation} onChange={(e) => setForm({ ...form, policeStation: e.target.value })} /></div>
            <div><label className="label">GD Filing Date</label><input className="input" type="date" required value={form.gdFilingDate} onChange={(e) => setForm({ ...form, gdFilingDate: e.target.value })} /></div>
            <div><label className="label">GD Filing Time</label><input className="input" type="time" value={form.gdFilingTime} onChange={(e) => setForm({ ...form, gdFilingTime: e.target.value })} /></div>
            <div><label className="label">Reporter Name</label><input className="input" required value={form.reporterName} onChange={(e) => setForm({ ...form, reporterName: e.target.value })} /></div>
            <div><label className="label">Officer Name (optional)</label><input className="input" value={form.officerName} onChange={(e) => setForm({ ...form, officerName: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">GD Document (PDF, JPG, JPEG, PNG — max 10MB)</label><input className="input" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          </div>
          <button type="submit" disabled={uploading} className="btn-primary w-full">{uploading ? "Uploading…" : "Upload GD Copy"}</button>
        </form>
      )}
    </div>
  );
}

function LocationSection({ caseId, data, isPrivileged, verifiedGD, onChange }: any) {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const loadLocation = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/cases/${caseId}/location`);
    if (res.ok) setLocation(await res.json());
    setLoading(false);
  }, [caseId]);

  useEffect(() => { loadLocation(); }, [loadLocation]);

  async function requestAssistance(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUpgradeRequired(false);
    setRequesting(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/location-request`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Request failed."); if (d.upgradeRequired) setUpgradeRequired(true); return; }
      setReason("");
      loadLocation();
      onChange();
    } finally { setRequesting(false); }
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-navy-950">Authorized Location Assistance</h2>

      {loading ? (
        <p className="mt-2 text-sm text-gray-500">Checking…</p>
      ) : location?.available ? (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="badge bg-navy-900 text-white">AUTHORIZED LOCATION INFORMATION</span>
            <span className="text-xs text-brand-amber font-semibold">{location.location.verificationStatus}</span>
          </div>
          <MapView latitude={location.location.latitude} longitude={location.location.longitude} label={location.location.address} />
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-gray-500">Latitude</dt><dd>{location.location.latitude.toFixed(5)}</dd></div>
            <div><dt className="text-gray-500">Longitude</dt><dd>{location.location.longitude.toFixed(5)}</dd></div>
            <div><dt className="text-gray-500">Accuracy</dt><dd>{location.location.accuracyMeters ? `${location.location.accuracyMeters} m` : "—"}</dd></div>
            <div><dt className="text-gray-500">Type</dt><dd>{location.location.isCurrent ? "Current" : "Last Known"}</dd></div>
            <div><dt className="text-gray-500">Source</dt><dd>{location.location.source.replaceAll("_", " ")}</dd></div>
            <div><dt className="text-gray-500">Captured</dt><dd>{new Date(location.location.capturedAt).toLocaleString()}</dd></div>
          </dl>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-600">No authorized location information is currently available.</p>
      )}

      {isPrivileged && !location?.available && (
        <div className="mt-5 border-t border-navy-900/5 pt-4">
          {!verifiedGD ? (
            <p className="text-sm text-gray-500">
              This person is not registered with SAFEBD with a voluntary location share, and this case does not
              yet have a verified GD document. Verify the GD before requesting authorized assistance.
            </p>
          ) : (
            <form onSubmit={requestAssistance} className="space-y-3">
              {error && (
                <div className="rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                  {upgradeRequired && (
                    <div className="mt-1 text-xs">
                      This is billed to the reporting family&apos;s subscription plan — ask them to upgrade on their{" "}
                      <a href="/dashboard/billing" className="font-semibold underline">Billing page</a>.
                    </div>
                  )}
                </div>
              )}
              <label className="label">Reason for requesting authorized location assistance</label>
              <textarea className="input" rows={2} required value={reason} onChange={(e) => setReason(e.target.value)} />
              <button type="submit" disabled={requesting} className="btn-primary">{requesting ? "Requesting…" : "Request Authorized Location Assistance"}</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
