import { prisma } from "./db";

export async function getGuestModeEnabled(): Promise<boolean> {
  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, guestModeEnabled: false },
  });
  return settings.guestModeEnabled;
}

export async function getGuestModeAudit(): Promise<{
  changedBy: string | null;
  changedAt: Date | null;
}> {
  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, guestModeEnabled: false },
  });
  return { changedBy: settings.guestModeChangedBy, changedAt: settings.guestModeChangedAt };
}

export async function setGuestModeEnabled(enabled: boolean, changedBy: string): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { guestModeEnabled: enabled, guestModeChangedBy: changedBy, guestModeChangedAt: new Date() },
    create: {
      id: 1,
      guestModeEnabled: enabled,
      guestModeChangedBy: changedBy,
      guestModeChangedAt: new Date(),
    },
  });
}
