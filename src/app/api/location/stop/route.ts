import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  await prisma.locationShare.updateMany({ where: { userId, isActive: true }, data: { isActive: false, stoppedAt: new Date() } });
  await writeAuditLog({ userId, action: "LOCATION_SHARE_STOPPED", ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true });
}
