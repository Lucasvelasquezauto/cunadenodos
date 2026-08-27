import { prisma } from "./db";

export async function getGuestModeEnabled(): Promise<boolean> {
  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, guestModeEnabled: false },
  });
  return settings.guestModeEnabled;
}

export async function setGuestModeEnabled(enabled: boolean): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { guestModeEnabled: enabled },
    create: { id: 1, guestModeEnabled: enabled },
  });
}
