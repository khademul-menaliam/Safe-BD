"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { phone, password, redirect: false });
      if (res?.ok) { router.push("/dashboard"); router.refresh(); }
      else setError("Invalid phone number or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Log in to SAFEBD</h1>
      <form onSubmit={onSubmit} className="card mt-6 space-y-4">
        {error && <div className="rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label">Phone number</label>
          <input className="input" required placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account? <Link href="/register" className="font-semibold text-navy-800 underline">Register</Link>
      </p>
      <div className="mt-6 card bg-navy-950/[0.03] text-xs text-gray-600">
        <div className="font-semibold text-navy-900">Demo accounts (seeded)</div>
        <ul className="mt-1 space-y-0.5">
          <li>Family: 01700000001 / password123</li>
          <li>Registered person: 01700000002 / password123</li>
          <li>Authority: 01700000003 / password123</li>
          <li>Admin: 01700000004 / password123</li>
        </ul>
      </div>
    </div>
  );
}
