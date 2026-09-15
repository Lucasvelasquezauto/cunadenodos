"use server";

import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { siteUrl } from "@/lib/site-url";
import { createInvitationLink } from "@/lib/invitations";
import { createPasswordResetToken } from "@/lib/passwords";
import { prisma } from "@/lib/db";

export async function generateInvitationLink(cohortId: string): Promise<string | null> {
  const session = await auth();
  if (!hasRole(session?.user, Role.ADMIN)) return null;

  const invitation = await createInvitationLink(cohortId);
  return siteUrl(`/invite/${invitation.token}`);
}

export async function generatePasswordResetLink(userId: string): Promise<string | null> {
  const session = await auth();
  if (!hasRole(session?.user, Role.ADMIN)) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const resetToken = await createPasswordResetToken(userId);
  return siteUrl(`/reset-password/${resetToken.token}`);
}
