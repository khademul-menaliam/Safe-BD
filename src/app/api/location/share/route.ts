import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  durationMinutes: z.number().int().positive().max(24 * 60).optional(),
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid location payload." }, { status: 400 });

  const userId = (session.user as any).id;
  await prisma.registeredPersonProfile.upsert({
    where: { userId }, update: { locationConsent: true, consentUpdatedAt: new Date() },
    create: { userId, locationConsent: true, consentUpdatedAt: new Date() },
  });

  await prisma.locationShare.updateMany({ where: { userId, isActive: true }, data: { isActive: false, stoppedAt: new Date() } });

  const expiresAt = parsed.data.durationMinutes ? new Date(Date.now() + parsed.data.durationMinutes * 60_000) : null;
  const share = await prisma.locationShare.create({
    data: {
      userId, isActive: true, expiresAt,
      points: { create: { latitude: parsed.data.latitude, longitude: parsed.data.longitude, accuracyMeters: parsed.data.accuracyMeters } },
    },
    include: { points: true },
  });

  await writeAuditLog({ userId, action: "LOCATION_SHARE_STARTED", metadata: { shareId: share.id }, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true, share });
}
