"use client";
import { useEffect, useState } from "react";

type Plan = {
  id: string; code: string; name: string; description: string; priceBDT: number;
  billingCycle: string | null; maxActiveCases: number; locationRequestsIncluded: number; isActive: boolean;
};

const EMPTY = { code: "", name: "", description: "", priceBDT: 0, billingCycle: "MONTHLY", maxActiveCases: 1, locationRequestsIncluded: 0 };

export default function ManagePlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/billing/admin-plans");
    if (res.ok) setPlans((await res.json()).plans);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/billing/admin-plans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          priceBDT: Number(form.priceBDT),
          maxActiveCases: Number(form.maxActiveCases),
          locationRequestsIncluded: Number(form.locationRequestsIncluded),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setForm(EMPTY);
      load();
    } finally { setSaving(false); }
  }

  function editPlan(p: Plan) {
    setForm({
      code: p.code, name: p.name, description: p.description, priceBDT: p.priceBDT,
      billingCycle: p.billingCycle ?? "MONTHLY", maxActiveCases: p.maxActiveCases, locationRequestsIncluded: p.locationRequestsIncluded,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Manage Subscription Plans</h1>
      <p className="mt-1 text-sm text-gray-600">
        Create or edit plans. <code className="rounded bg-navy-950/5 px-1">locationRequestsIncluded = 0</code> blocks
        authorized location-assistance requests entirely; <code className="rounded bg-navy-950/5 px-1">-1</code> means unlimited.
      </p>

      <form onSubmit={savePlan} className="card mt-6 grid gap-4 sm:grid-cols-3">
        {error && <div className="sm:col-span-3 rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
        <div><label className="label">Plan code (unique)</label><input className="input" required disabled={!!plans.find(p=>p.code===form.code)} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
        <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Price (BDT)</label><input className="input" type="number" min={0} required value={form.priceBDT} onChange={(e) => setForm({ ...form, priceBDT: e.target.value })} /></div>
        <div className="sm:col-span-3"><label className="label">Description</label><input className="input" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>
          <label className="label">Billing cycle</label>
          <select className="input" value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
            <option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
          </select>
        </div>
        <div><label className="label">Max active cases (-1 = unlimited)</label><input className="input" type="number" required value={form.maxActiveCases} onChange={(e) => setForm({ ...form, maxActiveCases: e.target.value })} /></div>
        <div><label className="label">Location requests / cycle (0 = none, -1 = unlimited)</label><input className="input" type="number" required value={form.locationRequestsIncluded} onChange={(e) => setForm({ ...form, locationRequestsIncluded: e.target.value })} /></div>
        <div className="sm:col-span-3 flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save plan"}</button>
          <button type="button" onClick={() => setForm(EMPTY)} className="btn-secondary">New plan</button>
        </div>
      </form>

      <div className="card mt-6 overflow-x-auto">
        {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-navy-900/10 text-gray-500"><th className="py-2 pr-4 font-medium">Code</th><th className="py-2 pr-4 font-medium">Name</th><th className="py-2 pr-4 font-medium">Price</th><th className="py-2 pr-4 font-medium">Max cases</th><th className="py-2 pr-4 font-medium">Loc. requests</th><th className="py-2 pr-4 font-medium"></th></tr></thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-navy-900/5 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs">{p.code}</td>
                  <td className="py-3 pr-4">{p.name}</td>
                  <td className="py-3 pr-4">{p.priceBDT === 0 ? "Free" : `৳${p.priceBDT}`}</td>
                  <td className="py-3 pr-4">{p.maxActiveCases < 0 ? "Unlimited" : p.maxActiveCases}</td>
                  <td className="py-3 pr-4">{p.locationRequestsIncluded < 0 ? "Unlimited" : p.locationRequestsIncluded}</td>
                  <td className="py-3 pr-4"><button onClick={() => editPlan(p)} className="text-xs font-semibold text-navy-800 underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
