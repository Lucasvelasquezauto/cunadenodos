"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalBool(formData: FormData, key: string): boolean | null {
  const value = formData.get(key);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function saveMyProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.EMPLEABLE) {
    redirect("/");
  }

  const headline = str(formData, "headline");
  const experienceAreas = str(formData, "experienceAreas");
  const linkedinUrl = str(formData, "linkedinUrl");
  if (!headline || !experienceAreas || !linkedinUrl) {
    redirect("/perfil?error=faltan_campos");
  }

  const data = {
    headline,
    postgraduates: str(formData, "postgraduates") || null,
    experienceAreas,
    motivations: str(formData, "motivations") || null,
    isEmployed: optionalBool(formData, "isEmployed"),
    isSeekingWork: optionalBool(formData, "isSeekingWork"),
    employmentStatusVisible: formData.get("employmentStatusVisible") === "on",
    linkedinUrl,
    contactLink: str(formData, "contactLink") || null,
    contactLinkPublic: formData.get("contactLinkPublic") === "on",
    photoUrl: str(formData, "photoUrl") || null,
  };

  await prisma.talentProfile.upsert({
    where: { ownerId: session.user.id },
    update: data,
    create: { ...data, ownerId: session.user.id, cohortId: session.user.cohortId },
  });

  revalidatePath("/perfil");
  revalidatePath("/talento");
  redirect("/perfil?guardado=1");
}
