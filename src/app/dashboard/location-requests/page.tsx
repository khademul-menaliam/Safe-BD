import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default async function LocationRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "AUTHORITY" && role !== "ADMIN") redirect("/dashboard");

  const requests = await prisma.locationRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { case: { select: { caseNumber: true, fullName: true } }, authorizedLocation: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Authorized Location Requests</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-600">
        Every request here goes through the <code className="rounded bg-navy-950/5 px-1">AuthorizedLocationProvider</code> abstraction,
        and is only allowed when the reporting family account has an active subscription that includes it
        (see <code className="rounded bg-navy-950/5 px-1">src/lib/subscription.ts</code>). Responses come from
        <code className="rounded bg-navy-950/5 px-1"> MockAuthorizedLocationProvider</code> and are clearly labeled demo data —
        no real telecom tracking is performed.
      </p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-900/10 text-gray-500">
              <th className="py-2 pr-4 font-medium">Case</th>
              <th className="py-2 pr-4 font-medium">GD Number</th>
              <th className="py-2 pr-4 font-medium">Reason</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Provider Ref</th>
              <th className="py-2 pr-4 font-medium">Requested</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-navy-900/5 last:border-0">
                <td className="py-3 pr-4">
                  <Link href={`/cases/${r.case.caseNumber}`} className="font-semibold text-navy-800 underline">{r.case.caseNumber}</Link>
                  <div className="text-xs text-gray-500">{r.case.fullName}</div>
                </td>
                <td className="py-3 pr-4">{r.gdNumber}</td>
                <td className="py-3 pr-4 max-w-xs truncate">{r.reason}</td>
                <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                <td className="py-3 pr-4 font-mono text-xs">{r.providerReference ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-500">{r.createdAt.toLocaleString()}</td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No location requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
