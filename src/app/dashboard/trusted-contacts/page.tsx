"use client";
import { useEffect, useState } from "react";

type Contact = { id: string; name: string; phone: string; relationship: string; canViewLocation: boolean };

export default function TrustedContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", relationship: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/trusted-contacts");
    if (res.ok) setContacts((await res.json()).contacts);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/trusted-contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setForm({ name: "", phone: "", relationship: "" });
      load();
    } finally { setSaving(false); }
  }

  async function toggleAccess(c: Contact) {
    await fetch(`/api/trusted-contacts/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ canViewLocation: !c.canViewLocation }) });
    load();
  }

  async function remove(c: Contact) {
    if (!confirm(`Remove ${c.name} from your trusted contacts?`)) return;
    await fetch(`/api/trusted-contacts/${c.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Trusted Contacts</h1>
      <p className="mt-1 text-sm text-gray-600">Only trusted contacts you approve can see your shared location and SOS alerts.</p>

      <form onSubmit={addContact} className="card mt-6 grid gap-4 sm:grid-cols-4">
        {error && <div className="sm:col-span-4 rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
        <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Phone</label><input className="input" required placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className="label">Relationship</label><input className="input" required placeholder="Mother, Friend…" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} /></div>
        <div className="flex items-end"><button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Adding…" : "Add contact"}</button></div>
      </form>

      <div className="card mt-6">
        {loading ? <p className="text-sm text-gray-500">Loading…</p> : contacts.length === 0 ? <p className="text-sm text-gray-500">No trusted contacts yet.</p> : (
          <div className="divide-y divide-navy-900/5">
            {contacts.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-medium text-navy-950">{c.name} <span className="font-normal text-gray-500">({c.relationship})</span></div>
                  <div className="text-sm text-gray-500">{c.phone}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleAccess(c)} className={`badge ${c.canViewLocation ? "bg-brand-green/15 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {c.canViewLocation ? "Location access: ON" : "Location access: OFF"}
                  </button>
                  <button onClick={() => remove(c)} className="text-sm font-semibold text-brand-red">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
