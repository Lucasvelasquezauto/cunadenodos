import { Role, type TalentProfile } from "@prisma/client";

type ProfileCompletenessFields = Pick<
  TalentProfile,
  "headline" | "experienceAreas" | "linkedinUrl"
>;

export function isProfileComplete(profile: ProfileCompletenessFields): boolean {
  return Boolean(
    profile.headline?.trim() &&
      profile.experienceAreas?.trim() &&
      profile.linkedinUrl?.trim(),
  );
}

type Viewer = { id: string; role: Role } | null | undefined;

// Ninguna página debe leer isEmployed/isSeekingWork directamente del registro
// de Prisma — siempre a través de este helper (o serializeTalentProfile), que
// decide si el dato sale del servidor, no si se muestra en el cliente.
//
// El chequeo de `viewer` va primero: `employmentStatusVisible` solo controla
// visibilidad entre miembros registrados del grupo curado (directory-talent),
// no frente a un invitado sin cuenta (guest-view) — un invitado nunca ve el
// estado laboral, sin importar ese campo.
export function canSeeEmploymentStatus(
  profile: Pick<TalentProfile, "employmentStatusVisible" | "ownerId">,
  viewer: Viewer,
): boolean {
  if (!viewer) return false;
  if (profile.employmentStatusVisible) return true;
  return viewer.id === profile.ownerId || viewer.role === Role.ADMIN;
}

export function serializeTalentProfile<T extends TalentProfile>(
  profile: T,
  viewer: Viewer,
): T {
  if (canSeeEmploymentStatus(profile, viewer)) return profile;
  return { ...profile, isEmployed: null, isSeekingWork: null };
}
