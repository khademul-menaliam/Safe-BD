import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await prisma.notification.findMany({ where: { userId: (session.user as any).id }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.notification.updateMany({ where: { id, userId: (session.user as any).id }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
