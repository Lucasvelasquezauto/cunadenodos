import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildTalentWhere,
  canSeeEmploymentStatus,
  isProfileComplete,
  isTalentSchool,
  isValidCvFile,
  serializeTalentProfile,
} from "../lib/talent";

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
    experienceYears: 5,
    school: "Arquitectura y Diseño",
    isEmployed: true,
    isSeekingWork: true,
    employmentStatusVisible: false,
    linkedinUrl: "https://linkedin.com/in/x",
    contactLink: null,
    contactLinkPublic: false,
    photoUrl: null,
    cvFileName: null,
    cvMimeType: null,
    cvFile: null,
    cvUploadedAt: null,
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

describe("isTalentSchool", () => {
  it("acepta un valor de la lista cerrada", () => {
    expect(isTalentSchool("Ingeniería")).toBe(true);
  });

  it("rechaza cualquier otro texto", () => {
    expect(isTalentSchool("Medicina")).toBe(false);
  });
});

describe("isValidCvFile", () => {
  function fakeFile(type: string, size: number, name = "cv.pdf"): File {
    return { type, size, name } as File;
  }

  it("acepta un PDF dentro del límite de tamaño", () => {
    expect(isValidCvFile(fakeFile("application/pdf", 1024))).toBe(true);
  });

  it("rechaza un archivo que no es PDF", () => {
    expect(isValidCvFile(fakeFile("image/png", 1024, "foto.png"))).toBe(false);
  });

  it("rechaza un archivo vacío", () => {
    expect(isValidCvFile(fakeFile("application/pdf", 0))).toBe(false);
  });

  it("rechaza un archivo por encima de 5MB", () => {
    expect(isValidCvFile(fakeFile("application/pdf", 6 * 1024 * 1024))).toBe(false);
  });
});

describe("buildTalentWhere", () => {
  it("sin filtros, devuelve un where vacío", () => {
    expect(buildTalentWhere({})).toEqual({});
  });

  it("filtra por escuela solo si es un valor válido de la lista", () => {
    expect(buildTalentWhere({ school: "Ingeniería" })).toEqual({ school: "Ingeniería" });
    expect(buildTalentWhere({ school: "no-existe" })).toEqual({});
  });

  it("filtra por años de experiencia mínimos", () => {
    expect(buildTalentWhere({ minExperience: 3 })).toEqual({
      experienceYears: { gte: 3 },
    });
  });

  it("ignora minExperience si es NaN", () => {
    expect(buildTalentWhere({ minExperience: Number.NaN })).toEqual({});
  });

  it("busca por texto libre en headline/experienceAreas/motivations", () => {
    expect(buildTalentWhere({ q: "logística" })).toEqual({
      OR: [
        { headline: { contains: "logística", mode: "insensitive" } },
        { experienceAreas: { contains: "logística", mode: "insensitive" } },
        { motivations: { contains: "logística", mode: "insensitive" } },
      ],
    });
  });

  it("combina todos los filtros a la vez", () => {
    expect(buildTalentWhere({ school: "Ingeniería", minExperience: 2, q: "datos" })).toEqual({
      school: "Ingeniería",
      experienceYears: { gte: 2 },
      OR: [
        { headline: { contains: "datos", mode: "insensitive" } },
        { experienceAreas: { contains: "datos", mode: "insensitive" } },
        { motivations: { contains: "datos", mode: "insensitive" } },
      ],
    });
  });
});
