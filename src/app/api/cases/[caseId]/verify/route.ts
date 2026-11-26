import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  gdDocumentId: z.string(),
  action: z.enum(["VERIFY", "REJECT", "REQUEST_INFO"]),
  reason: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { caseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== "AUTHORITY" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only authorized personnel can verify GD documents." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const c = await prisma.missingPersonCase.findUnique({ where: { caseNumber: params.caseId } });
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const gd = await prisma.gDDocument.findUnique({ where: { id: parsed.data.gdDocumentId } });
  if (!gd || gd.caseId !== c.id) return NextResponse.json({ error: "GD document not found" }, { status: 404 });

  if (parsed.data.action === "VERIFY") {
    await prisma.gDDocument.update({ where: { id: gd.id }, data: { status: "VERIFIED", verifiedById: userId, verifiedAt: new Date() } });
    await prisma.missingPersonCase.update({
      where: { id: c.id },
      data: { status: "GD_VERIFIED", timeline: { create: { label: "GD Verified", description: `GD ${gd.gdNumber} verified.`, actorId: userId } } },
    });
  } else if (parsed.data.action === "REJECT") {
    await prisma.gDDocument.update({ where: { id: gd.id }, data: { status: "REJECTED", verifiedById: userId, verifiedAt: new Date(), rejectionReason: parsed.data.reason ?? null } });
    await prisma.missingPersonCase.update({
      where: { id: c.id },
      data: { status: "REJECTED", timeline: { create: { label: "GD Rejected", description: parsed.data.reason ?? "GD document rejected.", actorId: userId } } },
    });
  } else {
    await prisma.missingPersonCase.update({
      where: { id: c.id },
      data: { status: "ADDITIONAL_INFORMATION_REQUIRED", timeline: { create: { label: "Additional Information Requested", description: parsed.data.reason ?? "Authority requested additional information.", actorId: userId } } },
    });
  }

  await writeAuditLog({ userId, action: `CASE_${parsed.data.action}`, caseId: c.id, metadata: { gdDocumentId: gd.id, reason: parsed.data.reason }, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true });
}
