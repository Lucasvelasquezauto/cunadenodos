import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canSeeEmploymentStatus, isProfileComplete, serializeTalentProfile } from "../lib/talent";

describe("isProfileComplete", () => {
  it("es verdadero con los tres campos requeridos llenos", () => {
    expect(
      isProfileComplete({
        headline: "Ingeniera industrial",
        experienceAreas: "Logística, mejora continua",
        linkedinUrl: "https://linkedin.com/in/ejemplo",
      }),
    ).toBe(true);
  });

  it("es falso sin LinkedIn", () => {
    expect(
      isProfileComplete({
        headline: "Ingeniera industrial",
        experienceAreas: "Logística, mejora continua",
        linkedinUrl: "",
      }),
    ).toBe(false);
  });
});

describe("canSeeEmploymentStatus", () => {
  const visibleProfile = { employmentStatusVisible: true, ownerId: "user-1" };
  const hiddenProfile = { employmentStatusVisible: false, ownerId: "user-1" };

  it("visible: cualquier miembro registrado del grupo lo ve", () => {
    expect(canSeeEmploymentStatus(visibleProfile, { id: "user-2", role: Role.EMPLEABLE })).toBe(true);
  });

  it("visible: un invitado sin cuenta (guest-view) no lo ve — employmentStatusVisible no aplica a invitados", () => {
    expect(canSeeEmploymentStatus(visibleProfile, null)).toBe(false);
  });

  it("oculto: nadie sin sesión lo ve", () => {
    expect(canSeeEmploymentStatus(hiddenProfile, null)).toBe(false);
  });

  it("oculto: otro usuario cualquiera no lo ve", () => {
    expect(canSeeEmploymentStatus(hiddenProfile, { id: "user-2", role: Role.EMPRENDEDOR })).toBe(false);
  });

  it("oculto: el dueño del perfil sí lo ve", () => {
    expect(canSeeEmploymentStatus(hiddenProfile, { id: "user-1", role: Role.EMPLEABLE })).toBe(true);
  });

  it("oculto: admin sí lo ve", () => {
    expect(canSeeEmploymentStatus(hiddenProfile, { id: "user-9", role: Role.ADMIN })).toBe(true);
  });
});

describe("serializeTalentProfile", () => {
  const base = {
    id: "p1",
    ownerId: "user-1",
    cohortId: "c1",
    headline: "Diseñadora",
    postgraduates: null,
    experienceAreas: "UX",
    motivations: null,
    isEmployed: true,
    isSeekingWork: true,
    employmentStatusVisible: false,
    linkedinUrl: "https://linkedin.com/in/x",
    contactLink: null,
    contactLinkPublic: false,
    photoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("redacta isEmployed/isSeekingWork a null cuando no se puede ver", () => {
    const result = serializeTalentProfile(base, { id: "user-2", role: Role.EMPLEABLE });
    expect(result.isEmployed).toBeNull();
    expect(result.isSeekingWork).toBeNull();
  });

  it("no redacta cuando el que mira es el dueño", () => {
    const result = serializeTalentProfile(base, { id: "user-1", role: Role.EMPLEABLE });
    expect(result.isEmployed).toBe(true);
    expect(result.isSeekingWork).toBe(true);
  });
});
