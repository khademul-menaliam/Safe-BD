import { prisma } from "./db";

export async function writeAuditLog(params: {
  userId?: string | null;
  action: string;
  caseId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        caseId: params.caseId ?? null,
        metadata: (params.metadata as any) ?? undefined,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}

export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return null;
}
