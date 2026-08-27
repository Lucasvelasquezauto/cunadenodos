"use server";

import { revalidatePath } from "next/cache";
import { Org, Role } from "@prisma/client";
import { prisma } from "@/lib/db";

const VALID_ROLES = [Role.ADMIN, Role.EMPRENDEDOR, Role.EMPLEABLE, Role.INSTITUCION];
const VALID_ORGS = [Org.EAFIT, Org.ANDI];

export async function createUser(formData: FormData) {
  const email = formData.get("email");
  const roleValue = formData.get("role");
  const cohortId = formData.get("cohortId");
  const orgValue = formData.get("org");

  if (typeof email !== "string" || email.trim().length === 0) return;
  if (typeof cohortId !== "string" || cohortId.length === 0) return;
  if (!VALID_ROLES.some((role) => role === roleValue)) return;
  const role = roleValue as Role;

  const org =
    role === Role.INSTITUCION && VALID_ORGS.some((o) => o === orgValue)
      ? (orgValue as Org)
      : undefined;

  await prisma.user.create({
    data: { email: email.trim(), role, cohortId, org },
  });
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}
