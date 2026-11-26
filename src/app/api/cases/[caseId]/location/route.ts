import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { caseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const c = await prisma.missingPersonCase.findUnique({ where: { caseNumber: params.caseId } });
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (c.reporterId !== userId && role !== "AUTHORITY" && role !== "ADMIN") {
    return NextResponse.json({ error: "You are not authorized to view this location." }, { status: 403 });
  }

  const authorizedLocation = await prisma.authorizedLocation.findFirst({ where: { caseId: c.id }, orderBy: { capturedAt: "desc" } });
  if (!authorizedLocation) {
    return NextResponse.json({ available: false, message: "No authorized location information is currently available." });
  }
  return NextResponse.json({ available: true, location: authorizedLocation });
}
