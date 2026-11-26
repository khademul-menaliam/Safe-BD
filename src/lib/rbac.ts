import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { Role } from "@prisma/client";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError("You must be signed in.");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  const role = (session.user as any).role as Role;
  if (!roles.includes(role)) throw new ForbiddenError("You are not authorized to perform this action.");
  return session;
}

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}
