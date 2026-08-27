"use server";

import { headers } from "next/headers";
import { createInvitationLink } from "@/lib/invitations";
import { createPasswordResetToken } from "@/lib/passwords";
import { prisma } from "@/lib/db";

function siteUrl(path: string): string {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}${path}`;
}

export async function generateInvitationLink(cohortId: string): Promise<string> {
  const invitation = await createInvitationLink(cohortId);
  return siteUrl(`/invite/${invitation.token}`);
}

export async function generatePasswordResetLink(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const resetToken = await createPasswordResetToken(userId);
  return siteUrl(`/reset-password/${resetToken.token}`);
}
