import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { normalizeBDPhone } from "@/lib/phone";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { getOrCreateFreeSubscription } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ users });
}

const createSchema = z.object({
  fullName: z.string().min(2), phone: z.string(), email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8), role: z.enum(["FAMILY_USER", "REGISTERED_PERSON", "AUTHORITY", "ADMIN"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const normalizedPhone = normalizeBDPhone(parsed.data.phone);
  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existing) return NextResponse.json({ error: "A user with this phone already exists." }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({ data: { fullName: parsed.data.fullName, phone: normalizedPhone, email: parsed.data.email || null, passwordHash, role: parsed.data.role } });
  await getOrCreateFreeSubscription(user.id);

  await writeAuditLog({ userId: (session.user as any).id, action: "ADMIN_CREATED_USER", metadata: { createdUserId: user.id, role: parsed.data.role }, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true });
}
