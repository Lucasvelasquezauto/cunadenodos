import type { DefaultSession } from "next-auth";
import type { Org, Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      org: Org | null;
      cohortId: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    org: Org | null;
    cohortId: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    org: Org | null;
    cohortId: string;
  }
}
