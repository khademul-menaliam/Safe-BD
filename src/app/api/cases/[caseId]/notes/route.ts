import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: Request, { params }: { params: { caseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "AUTHORITY" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only authorized personnel can add case notes." }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid note." }, { status: 400 });

  const c = await prisma.missingPersonCase.findUnique({ where: { caseNumber: params.caseId } });
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const note = await prisma.caseNote.create({ data: { caseId: c.id, authorId: (session.user as any).id, body: parsed.data.body, isAuthorityOnly: true } });
  return NextResponse.json({ success: true, note });
}
