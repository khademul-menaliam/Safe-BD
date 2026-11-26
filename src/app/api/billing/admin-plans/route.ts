import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { priceBDT: "asc" } });
  return NextResponse.json({ plans });
}

const schema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(1),
  priceBDT: z.number().int().min(0),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional().nullable(),
  maxActiveCases: z.number().int(),
  locationRequestsIncluded: z.number().int(),
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const plan = await prisma.subscriptionPlan.upsert({
    where: { code: parsed.data.code },
    update: {
      name: parsed.data.name, description: parsed.data.description, priceBDT: parsed.data.priceBDT,
      billingCycle: parsed.data.priceBDT === 0 ? null : parsed.data.billingCycle ?? "MONTHLY",
      maxActiveCases: parsed.data.maxActiveCases, locationRequestsIncluded: parsed.data.locationRequestsIncluded,
      isActive: parsed.data.isActive ?? true,
    },
    create: {
      code: parsed.data.code, name: parsed.data.name, description: parsed.data.description, priceBDT: parsed.data.priceBDT,
      billingCycle: parsed.data.priceBDT === 0 ? null : parsed.data.billingCycle ?? "MONTHLY",
      maxActiveCases: parsed.data.maxActiveCases, locationRequestsIncluded: parsed.data.locationRequestsIncluded,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return NextResponse.json({ success: true, plan });
}
