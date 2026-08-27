"use server";

import { headers } from "next/headers";
import { createInvitationLink } from "@/lib/invitations";
import { getLastGeneratedLink, signIn } from "@/lib/auth";

export async function generateInvitationLink(cohortId: string): Promise<string> {
  const invitation = await createInvitationLink(cohortId);
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}/invite/${invitation.token}`;
}

export async function generateAccessLink(email: string): Promise<string | null> {
  await signIn("resend", { email, redirect: false, redirectTo: "/" });
  return await getLastGeneratedLink(email);
}
