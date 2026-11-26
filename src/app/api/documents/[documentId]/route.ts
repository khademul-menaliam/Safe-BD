import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readGDFile } from "@/lib/uploads";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: { documentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const gd = await prisma.gDDocument.findUnique({ where: { id: params.documentId }, include: { case: true } });
  if (!gd) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const isOwner = gd.case.reporterId === userId;
  const isPrivileged = role === "AUTHORITY" || role === "ADMIN";
  if (!isOwner && !isPrivileged) {
    return NextResponse.json({ error: "You are not authorized to view this document." }, { status: 403 });
  }

  try {
    const buffer = await readGDFile(gd.storedFileName);
    await writeAuditLog({ userId, action: "GD_DOCUMENT_VIEWED", caseId: gd.caseId, metadata: { gdDocumentId: gd.id }, ipAddress: getClientIp(req) });
    return new NextResponse(buffer, {
      headers: { "Content-Type": gd.mimeType, "Content-Disposition": `inline; filename="${encodeURIComponent(gd.fileName)}"`, "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "File could not be read." }, { status: 500 });
  }
}
