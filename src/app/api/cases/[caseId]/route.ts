import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { caseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const c = await prisma.missingPersonCase.findUnique({
    where: { caseNumber: params.caseId },
    include: {
      gdDocuments: {
        select: { id: true, gdNumber: true, policeStation: true, gdFilingDate: true, gdFilingTime: true, reporterName: true, officerName: true, status: true, fileName: true, rejectionReason: true, createdAt: true },
      },
      timeline: { orderBy: { createdAt: "asc" }, include: { actor: { select: { fullName: true, role: true } } } },
      locationRequests: { orderBy: { createdAt: "desc" }, include: { authorizedLocation: true } },
      reporter: { select: { fullName: true, phone: true, email: true } },
    },
  });

  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const isOwner = c.reporterId === userId;
  const isPrivileged = role === "AUTHORITY" || role === "ADMIN";
  if (!isOwner && !isPrivileged) {
    return NextResponse.json({ error: "You are not authorized to view this case." }, { status: 403 });
  }

  return NextResponse.json({ case: c });
}
