import { Prisma, Role, type TalentProfile } from "@prisma/client";

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

// Lista cerrada para que el select de /perfil y el filtro de /talento usen
// exactamente los mismos valores — sin enum de Prisma porque EAFIT puede
// querer ajustar esta lista sin que cada cambio implique una migración.
export const TALENT_SCHOOLS = [
  "Ingeniería",
  "Economía y Finanzas",
  "Administración",
  "Derecho",
  "Ciencias",
  "Humanidades",
  "Arquitectura y Diseño",
  "Comunicación",
  "Otra",
] as const;

export type TalentSchool = (typeof TALENT_SCHOOLS)[number];

export function isTalentSchool(value: string): value is TalentSchool {
  return (TALENT_SCHOOLS as readonly string[]).includes(value);
}

// Límite generoso para una hoja de vida en PDF sin abrir la puerta a subir
// cualquier cosa a la base de datos (se guarda como bytes, ver schema.prisma).
export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;

export function isValidCvFile(file: File): boolean {
  const looksLikePdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  return looksLikePdf && file.size > 0 && file.size <= MAX_CV_SIZE_BYTES;
}

export type TalentFilters = {
  school?: string;
  minExperience?: number;
  q?: string;
};

// Compartido entre /talento y /invitado/talento — misma lógica de filtro para
// cualquiera que navegue el directorio, con o sin cuenta.
export function buildTalentWhere(filters: TalentFilters): Prisma.TalentProfileWhereInput {
  const where: Prisma.TalentProfileWhereInput = {};

  if (filters.school && isTalentSchool(filters.school)) {
    where.school = filters.school;
  }

  if (filters.minExperience !== undefined && !Number.isNaN(filters.minExperience)) {
    where.experienceYears = { gte: filters.minExperience };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { headline: { contains: q, mode: "insensitive" } },
      { experienceAreas: { contains: q, mode: "insensitive" } },
      { motivations: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
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
