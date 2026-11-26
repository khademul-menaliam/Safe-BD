import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { normalizeBDPhone } from "@/lib/phone";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";
import { getOrCreateFreeSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  const ip = getClientIp(req) ?? "unknown";
  if (!rateLimit(`register:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { fullName, phone, email, password, role } = parsed.data;
  const normalizedPhone = normalizeBDPhone(phone);

  if (role !== "FAMILY_USER" && role !== "REGISTERED_PERSON") {
    return NextResponse.json({ error: "Authority and admin accounts must be created by an administrator." }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existing) {
    return NextResponse.json({ error: "An account with this phone number already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      fullName, phone: normalizedPhone, email: email || null, passwordHash, role,
      ...(role === "REGISTERED_PERSON" ? { registeredProfile: { create: {} } } : {}),
    },
  });

  // Every new account starts on the free plan automatically.
  await getOrCreateFreeSubscription(user.id);

  await writeAuditLog({ userId: user.id, action: "USER_REGISTERED", metadata: { role }, ipAddress: ip });
  return NextResponse.json({ success: true });
}
