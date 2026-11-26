"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

type Plan = {
  id: string; code: string; name: string; description: string; priceBDT: number;
  billingCycle: string | null; maxActiveCases: number; locationRequestsIncluded: number;
};
type Subscription = {
  status: string; currentPeriodStart: string | null; currentPeriodEnd: string | null;
  locationRequestsUsedThisPeriod: number; cancelAtPeriodEnd: boolean; plan: Plan;
};
type Payment = { id: string; amountBDT: number; status: string; providerReference: string | null; isDemoPayment: boolean; createdAt: string };

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/billing/subscription");
    if (res.ok) {
      const data = await res.json();
      setSubscription(data.subscription);
      setPayments(data.payments);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function cancel() {
    if (!confirm("Cancel your subscription at the end of the current billing period? You'll keep access until then.")) return;
    setCancelling(true);
    try {
      await fetch("/api/billing/cancel", { method: "POST" });
      load();
    } finally { setCancelling(false); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Subscription &amp; Billing</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-600">
        Authorized location-assistance requests require an active paid plan — this keeps that capability
        from being triggered freely and discourages misuse. Reporting a case and GD verification stay free.
      </p>

      {subscription && (
        <div className="card mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-gray-500">Current plan</div>
              <div className="text-lg font-bold text-navy-950">{subscription.plan.name}</div>
              <div className="text-sm text-gray-600">{subscription.plan.description}</div>
            </div>
            <StatusBadge status={subscription.plan.priceBDT === 0 ? "NONE" : subscription.status} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-gray-500">Active cases allowed</dt><dd>{subscription.plan.maxActiveCases < 0 ? "Unlimited" : subscription.plan.maxActiveCases}</dd></div>
            <div>
              <dt className="text-gray-500">Location requests this period</dt>
              <dd>
                {subscription.plan.locationRequestsIncluded < 0
                  ? `${subscription.locationRequestsUsedThisPeriod} used (unlimited)`
                  : `${subscription.locationRequestsUsedThisPeriod} / ${subscription.plan.locationRequestsIncluded} used`}
              </dd>
            </div>
            {subscription.currentPeriodEnd && (
              <div><dt className="text-gray-500">Renews / expires</dt><dd>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</dd></div>
            )}
            {subscription.cancelAtPeriodEnd && (
              <div><dt className="text-gray-500">Status</dt><dd className="text-brand-red font-medium">Cancels at period end</dd></div>
            )}
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/pricing" className="btn-primary">{subscription.plan.priceBDT === 0 ? "Upgrade plan" : "Change plan"}</Link>
            {subscription.plan.priceBDT > 0 && !subscription.cancelAtPeriodEnd && (
              <button onClick={cancel} disabled={cancelling} className="btn-secondary">{cancelling ? "Cancelling…" : "Cancel subscription"}</button>
            )}
          </div>
        </div>
      )}

      <div className="card mt-6">
        <h2 className="font-semibold text-navy-950">Payment history</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No payments yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-navy-900/5">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <div className="font-medium text-navy-950">৳{p.amountBDT.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()} · {p.providerReference ?? "—"}</div>
                  {p.isDemoPayment && <div className="text-xs font-semibold text-brand-amber">DEMO PAYMENT — no real charge was made</div>}
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
