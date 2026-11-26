import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

const ALL_STATUSES = [
  "SUBMITTED", "GD_PENDING", "UNDER_REVIEW", "GD_VERIFIED", "ADDITIONAL_INFORMATION_REQUIRED",
  "LOCATION_ASSISTANCE_REQUESTED", "LOCATION_INFORMATION_RECEIVED", "RESOLVED", "CLOSED", "REJECTED",
];

export default async function CasesListPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const isPrivileged = role === "AUTHORITY" || role === "ADMIN";

  const where: any = isPrivileged ? {} : { reporterId: userId };
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.q) {
    const q = searchParams.q;
    where.OR = [
      { caseNumber: { contains: q, mode: "insensitive" } },
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { gdDocuments: { some: { gdNumber: { contains: q, mode: "insensitive" } } } },
      { gdDocuments: { some: { policeStation: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const cases = await prisma.missingPersonCase.findMany({
    where, orderBy: { createdAt: "desc" },
    include: { gdDocuments: { select: { status: true, gdNumber: true, policeStation: true } } },
    take: 100,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-950">Missing Person Cases</h1>
        <Link href="/missing-person/report" className="btn-danger">Report a Missing Person</Link>
      </div>

      <form className="card mt-6 flex flex-wrap gap-3" method="GET">
        <input name="q" defaultValue={searchParams.q} placeholder={isPrivileged ? "Search by Case ID, name, phone, GD number, police station…" : "Search your cases…"} className="input max-w-sm flex-1" />
        {isPrivileged && (
          <select name="status" defaultValue={searchParams.status ?? ""} className="input max-w-xs">
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
          </select>
        )}
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-900/10 text-gray-500">
              <th className="py-2 pr-4 font-medium">Case ID</th>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">GD Number</th>
              <th className="py-2 pr-4 font-medium">Police Station</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Reported</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-b border-navy-900/5 last:border-0">
                <td className="py-3 pr-4 font-mono text-xs">
                  <Link href={`/cases/${c.caseNumber}`} className="font-semibold text-navy-800 underline">{c.caseNumber}</Link>
                </td>
                <td className="py-3 pr-4">{c.fullName}</td>
                <td className="py-3 pr-4">{c.gdDocuments[0]?.gdNumber ?? "—"}</td>
                <td className="py-3 pr-4">{c.gdDocuments[0]?.policeStation ?? "—"}</td>
                <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                <td className="py-3 pr-4 text-gray-500">{c.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {cases.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No cases found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
