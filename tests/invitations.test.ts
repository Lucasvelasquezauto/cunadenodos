import { describe, expect, it } from "vitest";
import { evaluateInvitation } from "../lib/invitations";

const NOW = new Date("2026-08-25T12:00:00.000Z");

describe("evaluateInvitation", () => {
  it("es inválido cuando no existe el token", () => {
    expect(evaluateInvitation(null, NOW)).toEqual({
      valid: false,
      reason: "not_found",
    });
  });

  it("es inválido cuando ya expiró", () => {
    const invitation = {
      cohortId: "cohort-1",
      expiresAt: new Date("2026-08-24T12:00:00.000Z"),
    };
    expect(evaluateInvitation(invitation, NOW)).toEqual({
      valid: false,
      reason: "expired",
    });
  });

  it("es válido cuando todavía no expira", () => {
    const invitation = {
      cohortId: "cohort-1",
      expiresAt: new Date("2026-09-24T12:00:00.000Z"),
    };
    expect(evaluateInvitation(invitation, NOW)).toEqual({
      valid: true,
      cohortId: "cohort-1",
    });
  });
});
