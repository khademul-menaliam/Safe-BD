import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gdUploadSchema, ALLOWED_GD_MIME_TYPES, MAX_GD_FILE_SIZE_BYTES } from "@/lib/validators";
import { storeGDFile } from "@/lib/uploads";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { caseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const c = await prisma.missingPersonCase.findUnique({ where: { caseNumber: params.caseId } });
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (c.reporterId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "You are not authorized to upload documents for this case." }, { status: 403 });
  }

  const formData = await req.formData();
  const raw: Record<string, string> = {};
  formData.forEach((v, k) => { if (typeof v === "string") raw[k] = v; });
  const parsed = gdUploadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please attach the GD document." }, { status: 400 });
  }
  if (!ALLOWED_GD_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPG, JPEG, and PNG files are accepted." }, { status: 400 });
  }
  if (file.size > MAX_GD_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 10MB limit." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storedFileName } = await storeGDFile(buffer, file.name);

  const gd = await prisma.gDDocument.create({
    data: {
      caseId: c.id,
      gdNumber: parsed.data.gdNumber,
      policeStation: parsed.data.policeStation,
      gdFilingDate: new Date(parsed.data.gdFilingDate),
      gdFilingTime: parsed.data.gdFilingTime || null,
      reporterName: parsed.data.reporterName,
      officerName: parsed.data.officerName || null,
      fileName: file.name,
      storedFileName,
      mimeType: file.type,
      fileSizeBytes: file.size,
      status: "PENDING",
    },
  });

  await prisma.missingPersonCase.update({
    where: { id: c.id },
    data: { status: "UNDER_REVIEW", timeline: { create: { label: "GD Uploaded", description: `GD ${parsed.data.gdNumber} submitted for review.`, actorId: userId } } },
  });

  await writeAuditLog({ userId, action: "GD_UPLOADED", caseId: c.id, metadata: { gdDocumentId: gd.id }, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true, gdDocumentId: gd.id });
}
