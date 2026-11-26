import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return NextResponse.json({ error: "No subscription found." }, { status: 404 });

  const updated = await prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true } });
  await writeAuditLog({ userId, action: "SUBSCRIPTION_CANCEL_REQUESTED", ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true, subscription: updated });
}
