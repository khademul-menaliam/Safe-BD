"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", role: "FAMILY_USER" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      const signInRes = await signIn("credentials", { phone: form.phone, password: form.password, redirect: false });
      router.push(signInRes?.ok ? "/dashboard" : "/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Create your account</h1>
      <p className="mt-1 text-sm text-gray-600">Report a missing person, or set up a safety profile for yourself.</p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-4">
        {error && <div className="rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label">Full name</label>
          <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input className="input" required placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <label className="label">I am registering as</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="FAMILY_USER">Family member (report a missing person)</option>
            <option value="REGISTERED_PERSON">Myself (set up a safety profile)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Authority and admin accounts are created by SAFEBD administrators only.</p>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Creating account…" : "Create account"}</button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account? <Link href="/login" className="font-semibold text-navy-800 underline">Log in</Link>
      </p>
    </div>
  );
}
