"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isTalentSchool, isValidCvFile } from "@/lib/talent";

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
  const school = str(formData, "school");
  const experienceYearsRaw = str(formData, "experienceYears");
  const experienceYears = Number(experienceYearsRaw);
  if (
    !headline ||
    !experienceAreas ||
    !linkedinUrl ||
    !isTalentSchool(school) ||
    !experienceYearsRaw ||
    !Number.isInteger(experienceYears) ||
    experienceYears < 0
  ) {
    redirect("/perfil?error=faltan_campos");
  }

  // El input file siempre viaja en el FormData aunque no se elija nada — en
  // ese caso llega como File vacío (size 0), no como null.
  const cvFile = formData.get("cv");
  let cvData: {
    cvFileName: string;
    cvMimeType: string;
    cvFile: Uint8Array<ArrayBuffer>;
    cvUploadedAt: Date;
  } | null = null;
  if (cvFile instanceof File && cvFile.size > 0) {
    if (!isValidCvFile(cvFile)) {
      redirect("/perfil?error=cv_invalido");
    }
    cvData = {
      cvFileName: cvFile.name,
      cvMimeType: cvFile.type || "application/pdf",
      // File.arrayBuffer() siempre respalda en un ArrayBuffer real (nunca
      // SharedArrayBuffer) — el tipo ArrayBufferLike que infiere TS acá es
      // más ancho de lo que el runtime entrega.
      cvFile: new Uint8Array(await cvFile.arrayBuffer()) as Uint8Array<ArrayBuffer>,
      cvUploadedAt: new Date(),
    };
  }

  const data = {
    headline,
    postgraduates: str(formData, "postgraduates") || null,
    experienceAreas,
    motivations: str(formData, "motivations") || null,
    experienceYears,
    school,
    isEmployed: optionalBool(formData, "isEmployed"),
    isSeekingWork: optionalBool(formData, "isSeekingWork"),
    employmentStatusVisible: formData.get("employmentStatusVisible") === "on",
    linkedinUrl,
    contactLink: str(formData, "contactLink") || null,
    contactLinkPublic: formData.get("contactLinkPublic") === "on",
    photoUrl: str(formData, "photoUrl") || null,
    ...cvData,
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

export async function deleteMyCv() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.EMPLEABLE) {
    redirect("/");
  }

  await prisma.talentProfile.update({
    where: { ownerId: session.user.id },
    data: { cvFileName: null, cvMimeType: null, cvFile: null, cvUploadedAt: null },
  });

  revalidatePath("/perfil");
  redirect("/perfil?guardado=1");
}
