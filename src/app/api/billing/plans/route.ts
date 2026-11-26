import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint — plans are shown on /pricing to signed-out visitors too.
export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { priceBDT: "asc" } });
  return NextResponse.json({ plans });
}
