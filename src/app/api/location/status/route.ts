import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const share = await prisma.locationShare.findFirst({ where: { userId, isActive: true }, orderBy: { startedAt: "desc" }, include: { points: { orderBy: { capturedAt: "desc" }, take: 1 } } });
  return NextResponse.json({ share });
}
