import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { missingPersonReportSchema } from "@/lib/validators";
import { generateCaseNumber } from "@/lib/caseNumber";
import { normalizeBDPhone } from "@/lib/phone";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";
import { canCreateNewCase } from "@/lib/subscription";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const PHOTO_DIR = path.join(process.cwd(), "public", "case-photos");

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in to report a missing person." }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const ip = getClientIp(req) ?? "unknown";
  if (!rateLimit(`case-create:${userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  // Subscription gate: free plan allows a limited number of active cases.
  const quota = await canCreateNewCase(userId);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason, upgradeRequired: true }, { status: 402 });
  }

  const formData = await req.formData();
  const raw: Record<string, string> = {};
  formData.forEach((value, key) => { if (typeof value === "string") raw[key] = value; });

  const parsed = missingPersonReportSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(photo.type)) {
      return NextResponse.json({ error: "Photo must be a JPG, PNG, or WEBP image." }, { status: 400 });
    }
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo must be under 5MB." }, { status: 400 });
    }
    if (!existsSync(PHOTO_DIR)) await mkdir(PHOTO_DIR, { recursive: true });
    const ext = path.extname(photo.name) || ".jpg";
    const fileName = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await photo.arrayBuffer());
    await writeFile(path.join(PHOTO_DIR, fileName), buffer);
    photoUrl = `/case-photos/${fileName}`;
  }

  const caseNumber = await generateCaseNumber();

  const created = await prisma.missingPersonCase.create({
    data: {
      caseNumber,
      fullName: data.fullName,
      nickname: data.nickname || null,
      age: data.age,
      gender: data.gender,
      photoUrl,
      phone: data.phone ? normalizeBDPhone(data.phone) : null,
      alternatePhone: data.alternatePhone || null,
      lastSeenLocation: data.lastSeenLocation,
      lastSeenDate: new Date(data.lastSeenDate),
      lastSeenTime: data.lastSeenTime || null,
      clothingDescription: data.clothingDescription || null,
      physicalDescription: data.physicalDescription || null,
      medicalNotes: data.medicalNotes || null,
      additionalInfo: data.additionalInfo || null,
      reporterId: userId,
      reporterRelationship: data.reporterRelationship,
      reporterPhone: normalizeBDPhone(data.reporterPhone),
      reporterEmail: data.reporterEmail || null,
      status: "GD_PENDING",
      timeline: { create: [{ label: "Case Created", description: "Missing-person report submitted.", actorId: userId }] },
    },
  });

  await writeAuditLog({ userId, action: "CASE_CREATED", caseId: created.id, metadata: { caseNumber }, ipAddress: ip });
  return NextResponse.json({ success: true, caseNumber: created.caseNumber });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const statusFilter = searchParams.get("status") ?? undefined;

  const where: any = {};
  if (role === "FAMILY_USER") where.reporterId = userId;
  if (statusFilter) where.status = statusFilter;
  if (q) {
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
    include: { gdDocuments: { select: { id: true, status: true, gdNumber: true, policeStation: true } } },
  });

  return NextResponse.json({ cases });
}
