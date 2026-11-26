import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/subscription";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subscription = await getActiveSubscription((session.user as any).id);
  const payments = await prisma.payment.findMany({ where: { userId: (session.user as any).id }, orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ subscription, payments });
}
