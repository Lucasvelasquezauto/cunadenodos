"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { setGuestModeEnabled } from "@/lib/settings";

export async function toggleGuestMode(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || !session.user.email) return;

  const enabled = formData.get("guestModeEnabled") === "on";
  await setGuestModeEnabled(enabled, session.user.email);
  revalidatePath("/admin/settings");
}
