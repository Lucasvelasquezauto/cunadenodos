import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canAccessRoute, hasRole } from "../lib/permissions";

describe("hasRole", () => {
  it("es verdadero cuando el rol coincide", () => {
    expect(hasRole({ role: Role.ADMIN }, Role.ADMIN)).toBe(true);
  });

  it("es falso cuando el rol no coincide", () => {
    expect(hasRole({ role: Role.EMPRENDEDOR }, Role.ADMIN)).toBe(false);
  });

  it("es falso para un usuario sin sesión", () => {
    expect(hasRole(null, Role.ADMIN)).toBe(false);
    expect(hasRole(undefined, Role.ADMIN)).toBe(false);
  });
});

describe("canAccessRoute", () => {
  it("permite /admin solo al rol ADMIN", () => {
    expect(canAccessRoute({ role: Role.ADMIN }, "/admin")).toBe(true);
    expect(canAccessRoute({ role: Role.ADMIN }, "/admin/users")).toBe(true);
  });

  it("bloquea /admin a los demás roles y a usuarios sin sesión", () => {
    expect(canAccessRoute({ role: Role.EMPRENDEDOR }, "/admin")).toBe(false);
    expect(canAccessRoute({ role: Role.EMPLEABLE }, "/admin/users")).toBe(false);
    expect(canAccessRoute({ role: Role.INSTITUCION }, "/admin")).toBe(false);
    expect(canAccessRoute(null, "/admin")).toBe(false);
  });

  it("permite rutas no restringidas a cualquiera", () => {
    expect(canAccessRoute(null, "/")).toBe(true);
    expect(canAccessRoute({ role: Role.EMPLEABLE }, "/invitado")).toBe(true);
  });
});
