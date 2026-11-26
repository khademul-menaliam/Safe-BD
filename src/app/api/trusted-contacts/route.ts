import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trustedContactSchema } from "@/lib/validators";
import { normalizeBDPhone } from "@/lib/phone";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await prisma.trustedContact.findMany({ where: { ownerId: (session.user as any).id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = trustedContactSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const contact = await prisma.trustedContact.create({
    data: { ownerId: (session.user as any).id, name: parsed.data.name, phone: normalizeBDPhone(parsed.data.phone), relationship: parsed.data.relationship },
  });
  return NextResponse.json({ success: true, contact });
}
