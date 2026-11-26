import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ latitude: z.number(), longitude: z.number(), accuracyMeters: z.number().optional() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid location payload." }, { status: 400 });

  const share = await prisma.locationShare.findFirst({ where: { userId, isActive: true }, orderBy: { startedAt: "desc" } });
  if (!share) return NextResponse.json({ error: "No active location share." }, { status: 400 });

  if (share.expiresAt && share.expiresAt < new Date()) {
    await prisma.locationShare.update({ where: { id: share.id }, data: { isActive: false, stoppedAt: new Date(), reason: "TIMER_EXPIRED" } });
    return NextResponse.json({ error: "Your sharing period has expired." }, { status: 410 });
  }

  const point = await prisma.locationPoint.create({ data: { shareId: share.id, latitude: parsed.data.latitude, longitude: parsed.data.longitude, accuracyMeters: parsed.data.accuracyMeters } });
  return NextResponse.json({ success: true, point });
}
