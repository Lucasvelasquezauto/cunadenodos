"use server";

import { revalidatePath } from "next/cache";
import { setGuestModeEnabled } from "@/lib/settings";

export async function toggleGuestMode(formData: FormData) {
  const enabled = formData.get("guestModeEnabled") === "on";
  await setGuestModeEnabled(enabled);
  revalidatePath("/admin/settings");
}
