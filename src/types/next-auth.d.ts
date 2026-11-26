import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; role: Role; phone: string };
  }
  interface User {
    id: string;
    role: Role;
    phone: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    phone: string;
  }
}
