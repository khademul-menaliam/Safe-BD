import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({ canViewLocation: z.boolean().optional(), name: z.string().optional(), relationship: z.string().optional() });

export async function PATCH(req: Request, { params }: { params: { contactId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contact = await prisma.trustedContact.findUnique({ where: { id: params.contactId } });
  if (!contact || contact.ownerId !== (session.user as any).id) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const updated = await prisma.trustedContact.update({ where: { id: contact.id }, data: parsed.data });
  return NextResponse.json({ success: true, contact: updated });
}

export async function DELETE(_req: Request, { params }: { params: { contactId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contact = await prisma.trustedContact.findUnique({ where: { id: params.contactId } });
  if (!contact || contact.ownerId !== (session.user as any).id) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  await prisma.trustedContact.delete({ where: { id: contact.id } });
  return NextResponse.json({ success: true });
}
