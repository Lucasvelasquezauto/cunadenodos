import { describe, expect, it } from "vitest";
import { canViewConversation } from "../lib/messaging";

// findOrCreateConversation y canContact dependen de Prisma/DB directamente
// (mismo criterio que el resto del proyecto: lo que toca la base se cubre
// con e2e, no con mocks — ver e2e/messaging.spec.ts). Aquí solo se cubre la
// pieza pura: quién puede ver una conversación dada.
describe("canViewConversation", () => {
  const conversation = { initiatorId: "user-1", recipientId: "user-2" };

  it("el iniciador puede verla", () => {
    expect(canViewConversation(conversation, "user-1")).toBe(true);
  });

  it("el destinatario puede verla", () => {
    expect(canViewConversation(conversation, "user-2")).toBe(true);
  });

  it("un tercero no puede verla, aunque sea admin en la práctica de la app", () => {
    expect(canViewConversation(conversation, "user-9")).toBe(false);
  });
});
