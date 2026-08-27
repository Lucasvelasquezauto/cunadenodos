"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createCohort(formData: FormData) {
  const name = formData.get("name");
  const isActive = formData.get("isActive") === "on";
  if (typeof name !== "string" || name.trim().length === 0) return;

  await prisma.cohort.create({ data: { name: name.trim(), isActive } });
  revalidatePath("/admin/cohorts");
}
