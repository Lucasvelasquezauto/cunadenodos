"use server";

import { auth, signOut } from "@/lib/auth";
import { createPasswordResetToken } from "@/lib/passwords";
import { siteUrl } from "@/lib/site-url";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function generateMyPasswordResetLink(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;

  const resetToken = await createPasswordResetToken(session.user.id);
  return siteUrl(`/reset-password/${resetToken.token}`);
}
