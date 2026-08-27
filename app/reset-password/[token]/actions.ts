"use server";

import { redirect } from "next/navigation";
import { consumeResetToken } from "@/lib/passwords";

const MIN_PASSWORD_LENGTH = 8;

export async function setNewPassword(token: string, formData: FormData) {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    redirect(`/reset-password/${token}?error=weak_password`);
  }
  if (password !== confirmPassword) {
    redirect(`/reset-password/${token}?error=password_mismatch`);
  }

  const ok = await consumeResetToken(token, password);
  if (!ok) {
    redirect(`/reset-password/${token}?error=invalid_token`);
  }

  redirect("/login");
}
