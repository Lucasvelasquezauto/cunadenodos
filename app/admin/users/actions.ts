"use server";

import { revalidatePath } from "next/cache";
import { Org, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";

const VALID_ROLES = [Role.ADMIN, Role.EMPRENDEDOR, Role.EMPLEABLE, Role.INSTITUCION];
const VALID_ORGS = [Org.EAFIT, Org.ANDI];
const MIN_PASSWORD_LENGTH = 8;

export async function createUser(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const roleValue = formData.get("role");
  const cohortId = formData.get("cohortId");
  const orgValue = formData.get("org");

  if (typeof email !== "string" || email.trim().length === 0) return;
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) return;
  if (typeof cohortId !== "string" || cohortId.length === 0) return;
  if (!VALID_ROLES.some((role) => role === roleValue)) return;
  const role = roleValue as Role;

  const org =
    role === Role.INSTITUCION && VALID_ORGS.some((o) => o === orgValue)
      ? (orgValue as Org)
      : undefined;

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email: email.trim(), role, cohortId, org, passwordHash },
  });
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}
