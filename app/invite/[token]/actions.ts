"use server";

import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateInvitationToken } from "@/lib/invitations";
import { hashPassword } from "@/lib/passwords";

const MIN_PASSWORD_LENGTH = 8;

export async function joinWithInvitation(token: string, formData: FormData) {
  const email = formData.get("email");
  if (typeof email !== "string" || email.length === 0) {
    redirect(`/invite/${token}?error=missing_email`);
  }

  const trackValue = formData.get("track");
  if (trackValue !== Role.EMPRENDEDOR && trackValue !== Role.EMPLEABLE) {
    redirect(`/invite/${token}?error=missing_track`);
  }
  const track = trackValue as typeof Role.EMPRENDEDOR | typeof Role.EMPLEABLE;

  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    redirect(`/invite/${token}?error=weak_password`);
  }
  if (password !== confirmPassword) {
    redirect(`/invite/${token}?error=password_mismatch`);
  }

  // Consentimiento granular (Ley 1581 de 2012 / Decreto 1377 de 2013) —
  // ambos obligatorios, sin ninguno de los dos no se crea la cuenta. Ver
  // SPEC-onboarding.md para el texto exacto que el usuario aceptó en el
  // formulario.
  if (formData.get("consentDataProcessing") !== "on" || formData.get("consentDirectory") !== "on") {
    redirect(`/invite/${token}?error=missing_consent`);
  }

  const validation = await validateInvitationToken(token);
  if (!validation.valid) {
    redirect(`/invite/${token}?error=${validation.reason}`);
  }

  // A diferencia del magic link, una contraseña sí es un factor de
  // autenticación real — si el correo ya tiene cuenta, no la creamos de
  // nuevo ni dejamos entrar sin la contraseña correcta. Esa persona ya tiene
  // cuenta y debe usar /login.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/invite/${token}?error=already_registered`);
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      email,
      role: track,
      cohortId: validation.cohortId,
      passwordHash,
      consentDataProcessingAt: new Date(),
      consentDirectoryAt: new Date(),
    },
  });

  await signIn("credentials", { email, password, redirect: false });
  redirect("/");
}
