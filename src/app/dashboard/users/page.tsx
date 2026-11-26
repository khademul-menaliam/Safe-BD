"use client";
import { useEffect, useState } from "react";

type UserRow = { id: string; fullName: string; phone: string; email: string | null; role: string; isActive: boolean; createdAt: string };
const EMPTY = { fullName: "", phone: "", email: "", password: "", role: "AUTHORITY" };

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers((await res.json()).users);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setForm(EMPTY);
      load();
    } finally { setSaving(false); }
  }

  async function toggleActive(u: UserRow) {
    await fetch(`/api/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !u.isActive }) });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Manage Users</h1>
      <p className="mt-1 text-sm text-gray-600">Create authority and admin accounts here — they cannot self-register.</p>

      <form onSubmit={createUser} className="card mt-6 grid gap-4 sm:grid-cols-3">
        {error && <div className="sm:col-span-3 rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
        <div><label className="label">Full name</label><input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
        <div><label className="label">Phone</label><input className="input" required placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="AUTHORITY">Authority</option><option value="ADMIN">Admin</option>
            <option value="FAMILY_USER">Family user</option><option value="REGISTERED_PERSON">Registered person</option>
          </select>
        </div>
        <div className="flex items-end"><button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Creating…" : "Create account"}</button></div>
      </form>

      <div className="card mt-6 overflow-x-auto">
        {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead><tr className="border-b border-navy-900/10 text-gray-500"><th className="py-2 pr-4 font-medium">Name</th><th className="py-2 pr-4 font-medium">Phone</th><th className="py-2 pr-4 font-medium">Role</th><th className="py-2 pr-4 font-medium">Status</th><th className="py-2 pr-4 font-medium"></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-navy-900/5 last:border-0">
                  <td className="py-3 pr-4">{u.fullName}</td>
                  <td className="py-3 pr-4">{u.phone}</td>
                  <td className="py-3 pr-4">{u.role}</td>
                  <td className="py-3 pr-4"><span className={`badge ${u.isActive ? "bg-brand-green/15 text-green-700" : "bg-gray-100 text-gray-600"}`}>{u.isActive ? "Active" : "Disabled"}</span></td>
                  <td className="py-3 pr-4"><button onClick={() => toggleActive(u)} className="text-xs font-semibold text-navy-800 underline">{u.isActive ? "Disable" : "Enable"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
