import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ latitude: z.number().optional(), longitude: z.number().optional(), message: z.string().max(500).optional() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const sos = await prisma.sOSAlert.create({ data: { userId, status: "ACTIVE", latitude: parsed.data.latitude, longitude: parsed.data.longitude, message: parsed.data.message } });

  if (parsed.data.latitude != null && parsed.data.longitude != null) {
    await prisma.locationShare.updateMany({ where: { userId, isActive: true }, data: { isActive: false, stoppedAt: new Date() } });
    await prisma.locationShare.create({ data: { userId, isActive: true, reason: "SOS", points: { create: { latitude: parsed.data.latitude, longitude: parsed.data.longitude } } } });
  }

  // Notification abstraction: DEMO NOTIFICATION only. No real SMS provider configured.
  const contacts = await prisma.trustedContact.findMany({ where: { ownerId: userId, canViewLocation: true } });
  const demoNotifications = contacts.map((c) => ({
    userId, type: "SOS_ALERT" as const, title: "DEMO NOTIFICATION SENT",
    body: `(Demo) Would notify ${c.name} (${c.phone}) of an SOS alert. No real SMS/telecom provider is configured.`,
  }));
  if (demoNotifications.length > 0) await prisma.notification.createMany({ data: demoNotifications });

  await writeAuditLog({ userId, action: "SOS_TRIGGERED", metadata: { sosId: sos.id }, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true, sos, notified: contacts.map((c) => ({ name: c.name, phone: c.phone })), demo: demoNotifications.length > 0 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json().catch(() => ({}));
  const active = await prisma.sOSAlert.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
  if (!active) return NextResponse.json({ error: "No active SOS alert." }, { status: 400 });
  const updated = await prisma.sOSAlert.update({ where: { id: active.id }, data: { status: body.status === "CANCELLED" ? "CANCELLED" : "RESOLVED", resolvedAt: new Date() } });
  return NextResponse.json({ success: true, sos: updated });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const active = await prisma.sOSAlert.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ active });
}
