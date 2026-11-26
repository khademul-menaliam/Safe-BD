import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getActiveSubscription } from "@/lib/subscription";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const caseWhere = role === "FAMILY_USER" ? { reporterId: userId } : {};

  const [activeCases, pendingGD, locationRequests, activeSOS, resolvedCases, recentCases, subscription] = await Promise.all([
    prisma.missingPersonCase.count({ where: { ...caseWhere, status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] } } }),
    prisma.gDDocument.count({ where: { status: "PENDING", case: caseWhere } }),
    prisma.locationRequest.count({ where: { case: caseWhere } }),
    prisma.sOSAlert.count({ where: { status: "ACTIVE", ...(role !== "AUTHORITY" && role !== "ADMIN" ? { userId } : {}) } }),
    prisma.missingPersonCase.count({ where: { ...caseWhere, status: "RESOLVED" } }),
    prisma.missingPersonCase.findMany({ where: caseWhere, orderBy: { createdAt: "desc" }, take: 5 }),
    role === "FAMILY_USER" || role === "REGISTERED_PERSON" ? getActiveSubscription(userId) : Promise.resolve(null),
  ]);

  const cards = [
    { label: "Active Cases", value: activeCases, href: "/dashboard/cases" },
    { label: "Pending GD Verification", value: pendingGD, href: "/dashboard/cases" },
    { label: "Location Requests", value: locationRequests, href: "/dashboard/location-requests" },
    { label: "Active SOS", value: activeSOS, href: "/dashboard/notifications" },
    { label: "Resolved Cases", value: resolvedCases, href: "/dashboard/cases" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Welcome, {session.user.name?.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-gray-600">Here&apos;s an overview of your SAFEBD activity.</p>

      {subscription && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">Current plan</div>
            <div className="font-semibold text-navy-950">{subscription.plan.name}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${subscription.status === "ACTIVE" && subscription.plan.priceBDT > 0 ? "bg-brand-green/15 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {subscription.plan.priceBDT === 0 ? "Free plan" : subscription.status}
            </span>
            <Link href="/dashboard/billing" className="text-sm font-semibold text-navy-800 underline">Manage subscription</Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl font-extrabold text-navy-950">{c.value}</div>
            <div className="mt-1 text-sm text-gray-600">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="card mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-navy-950">Recent Cases</h2>
          <Link href="/dashboard/cases" className="text-sm font-semibold text-navy-800 underline">View all</Link>
        </div>
        {recentCases.length === 0 ? (
          <p className="text-sm text-gray-500">No cases yet.</p>
        ) : (
          <div className="divide-y divide-navy-900/5">
            {recentCases.map((c) => (
              <Link key={c.id} href={`/cases/${c.caseNumber}`} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <div className="font-medium text-navy-950">{c.fullName}</div>
                  <div className="text-xs text-gray-500">{c.caseNumber}</div>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
