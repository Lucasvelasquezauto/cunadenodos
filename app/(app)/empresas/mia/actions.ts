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

export async function saveMyCompany(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.EMPRENDEDOR) {
    redirect("/");
  }

  const name = str(formData, "name");
  const tagline = str(formData, "tagline");
  const description = str(formData, "description");
  const valueProp = str(formData, "valueProp");
  if (!name || !tagline || !description || !valueProp) {
    redirect("/empresas/mia?error=faltan_campos");
  }

  const founders = [1, 2, 3]
    .map((i) => ({
      name: str(formData, `founder${i}Name`),
      bio: str(formData, `founder${i}Bio`),
    }))
    .filter((f) => f.name.length > 0);

  const data = {
    name,
    tagline,
    sector: str(formData, "sector") || null,
    logoUrl: str(formData, "logoUrl") || null,
    description,
    purpose: str(formData, "purpose") || null,
    values: str(formData, "values") || null,
    valueProp,
    founders,
    website: str(formData, "website") || null,
    contactLink: str(formData, "contactLink") || null,
    contactLinkPublic: formData.get("contactLinkPublic") === "on",
  };

  await prisma.company.upsert({
    where: { ownerId: session.user.id },
    update: data,
    create: { ...data, ownerId: session.user.id, cohortId: session.user.cohortId },
  });

  revalidatePath("/empresas/mia");
  revalidatePath("/empresas");
  redirect("/empresas/mia?guardado=1");
}
