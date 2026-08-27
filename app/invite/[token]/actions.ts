"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Role } from "@prisma/client";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateInvitationToken } from "@/lib/invitations";

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

  // Si el correo ya existe, no se toca su rol/cohorte — solo se le manda el
  // acceso normal. La cuenta única solo se crea la primera vez.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        role: track,
        cohortId: validation.cohortId,
        consentDataProcessingAt: new Date(),
        consentDirectoryAt: new Date(),
      },
    });
  }

  try {
    await signIn("resend", { email, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/invite/${token}?error=signin_failed`);
    }
    throw error;
  }
}
