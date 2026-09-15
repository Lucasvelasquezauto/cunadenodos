import { prisma } from "./db";

// Antes cada lectura recreaba la fila en silencio (upsert con create) si no
// la encontraba, apagando el modo invitado y borrando el rastro de
// auditoría sin dejar ningún indicio de que había pasado — así se perdió
// más de una vez sin explicación (ver memoria del proyecto). Ahora, si de
// verdad hay que crearla, al menos queda un log de cuándo y por qué.
async function ensureAppSettings() {
  const existing = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  console.warn(
    "[settings] AppSettings#1 no existía — se recrea con guestModeEnabled=false. " +
      "Si esto no era lo esperado, la fila se perdió por fuera del toggle normal de /admin/settings.",
  );
  try {
    return await prisma.appSettings.create({ data: { id: 1, guestModeEnabled: false } });
  } catch {
    // Otra petición concurrente ya la creó justo antes — no es un error real.
    return prisma.appSettings.findUniqueOrThrow({ where: { id: 1 } });
  }
}

export async function getGuestModeEnabled(): Promise<boolean> {
  const settings = await ensureAppSettings();
  return settings.guestModeEnabled;
}

export async function getGuestModeAudit(): Promise<{
  changedBy: string | null;
  changedAt: Date | null;
}> {
  const settings = await ensureAppSettings();
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
