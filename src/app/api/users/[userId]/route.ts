import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await prisma.user.update({ where: { id: params.userId }, data: { isActive: parsed.data.isActive } });
  return NextResponse.json({ success: true });
}
