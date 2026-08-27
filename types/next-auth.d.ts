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
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
    org: Org | null;
    cohortId: string;
  }
}
