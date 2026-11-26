"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Plan = {
  id: string; code: string; name: string; description: string; priceBDT: number;
  billingCycle: string | null; maxActiveCases: number; locationRequestsIncluded: number;
};

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetch("/api/billing/plans").then((r) => r.json()).then((d) => { setPlans(d.plans); setLoading(false); });
  }, []);

  function choosePlan(plan: Plan) {
    if (status !== "authenticated") { router.push("/register"); return; }
    if (plan.priceBDT === 0) { router.push("/dashboard/billing"); return; }
    setCheckoutPlan(plan);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy-950">Plans &amp; Pricing</h1>
        <p className="mx-auto mt-2 max-w-2xl text-gray-600">
          Reporting a missing person and tracking GD verification is always free. Authorized
          location-assistance requests — which create real work for police/telecom coordination on a
          verified case — require an active paid plan. This keeps the system usable and discourages misuse.
        </p>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-gray-500">Loading plans…</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className={`card flex flex-col ${plan.priceBDT > 0 ? "border-2 border-navy-900" : ""}`}>
              <div className="font-bold text-navy-950">{plan.name}</div>
              <div className="mt-2 text-3xl font-extrabold text-navy-950">
                {plan.priceBDT === 0 ? "Free" : `৳${plan.priceBDT.toLocaleString()}`}
                {plan.billingCycle && <span className="text-sm font-normal text-gray-500">/{plan.billingCycle === "YEARLY" ? "year" : "month"}</span>}
              </div>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-700">
                <li>✓ {plan.maxActiveCases < 0 ? "Unlimited" : plan.maxActiveCases} active missing-person case(s)</li>
                <li>✓ Free GD upload &amp; verification</li>
                <li>
                  {plan.locationRequestsIncluded === 0 ? "✗ No authorized location-assistance requests" :
                   plan.locationRequestsIncluded < 0 ? "✓ Unlimited authorized location-assistance requests" :
                   `✓ ${plan.locationRequestsIncluded} authorized location-assistance request(s) / cycle`}
                </li>
              </ul>
              <button onClick={() => choosePlan(plan)} className={plan.priceBDT > 0 ? "btn-primary mt-6 w-full" : "btn-secondary mt-6 w-full"}>
                {plan.priceBDT === 0 ? "Get started free" : "Subscribe"}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-gray-500">
        Billing uses a demo payment provider in this build — no real card network is contacted and no real
        money moves. See <Link href="/privacy" className="underline">Privacy</Link> for details.
      </p>

      {checkoutPlan && (
        <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} onSuccess={() => { setCheckoutPlan(null); router.push("/dashboard/billing"); }} />
      )}
    </div>
  );
}

function CheckoutModal({ plan, onClose, onSuccess }: { plan: Plan; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ cardNumber: "", cardName: "", expiry: "", cvc: "" });
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: plan.code, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Payment failed."); return; }
      onSuccess();
    } finally { setPaying(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 px-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy-950">Subscribe to {plan.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          ৳{plan.priceBDT.toLocaleString()} / {plan.billingCycle === "YEARLY" ? "year" : "month"} — demo payment, no real charge.
        </p>

        <form onSubmit={pay} className="mt-4 space-y-3">
          {error && <div className="rounded-lg bg-brand-red/10 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
          <div><label className="label">Cardholder name</label><input className="input" required value={form.cardName} onChange={(e) => setForm({ ...form, cardName: e.target.value })} /></div>
          <div><label className="label">Card number</label><input className="input" required inputMode="numeric" placeholder="4242 4242 4242 4242" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Expiry</label><input className="input" required placeholder="MM/YY" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></div>
            <div><label className="label">CVC</label><input className="input" required inputMode="numeric" placeholder="123" value={form.cvc} onChange={(e) => setForm({ ...form, cvc: e.target.value })} /></div>
          </div>
          <button type="submit" disabled={paying} className="btn-primary w-full">{paying ? "Processing…" : `Pay ৳${plan.priceBDT.toLocaleString()}`}</button>
        </form>
      </div>
    </div>
  );
}
