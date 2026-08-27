import { describe, expect, it } from "vitest";
import { evaluateResetToken, hashPassword, verifyPassword } from "../lib/passwords";

const NOW = new Date("2026-08-26T12:00:00.000Z");

describe("evaluateResetToken", () => {
  it("es inválido cuando no existe el token", () => {
    expect(evaluateResetToken(null, NOW)).toEqual({
      valid: false,
      reason: "not_found",
    });
  });

  it("es inválido cuando ya expiró", () => {
    const record = {
      userId: "user-1",
      expiresAt: new Date("2026-08-25T12:00:00.000Z"),
      usedAt: null,
    };
    expect(evaluateResetToken(record, NOW)).toEqual({
      valid: false,
      reason: "expired",
    });
  });

  it("es inválido cuando ya se usó", () => {
    const record = {
      userId: "user-1",
      expiresAt: new Date("2026-09-02T12:00:00.000Z"),
      usedAt: new Date("2026-08-26T10:00:00.000Z"),
    };
    expect(evaluateResetToken(record, NOW)).toEqual({
      valid: false,
      reason: "used",
    });
  });

  it("es válido cuando no expiró y no se ha usado", () => {
    const record = {
      userId: "user-1",
      expiresAt: new Date("2026-09-02T12:00:00.000Z"),
      usedAt: null,
    };
    expect(evaluateResetToken(record, NOW)).toEqual({
      valid: true,
      userId: "user-1",
    });
  });
});

describe("hashPassword / verifyPassword", () => {
  it("verifica correctamente una contraseña contra su hash", async () => {
    const hash = await hashPassword("BecaSerAndi*");
    expect(await verifyPassword("BecaSerAndi*", hash)).toBe(true);
    expect(await verifyPassword("otra-cosa", hash)).toBe(false);
  });
});
