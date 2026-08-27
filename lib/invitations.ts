import { randomBytes } from "crypto";
import { prisma } from "./db";

const DEFAULT_EXPIRY_DAYS = 30;

export async function createInvitationLink(cohortId: string, expiryDays = DEFAULT_EXPIRY_DAYS) {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  return prisma.invitationLink.create({
    data: { token, cohortId, expiresAt },
  });
}

export type InvitationValidation =
  | { valid: true; cohortId: string }
  | { valid: false; reason: "not_found" | "expired" };

type InvitationRecord = { cohortId: string; expiresAt: Date } | null;

// Lógica pura, separada del acceso a datos, para poder probarla sin una DB real.
export function evaluateInvitation(
  invitation: InvitationRecord,
  now: Date = new Date(),
): InvitationValidation {
  if (!invitation) return { valid: false, reason: "not_found" };
  if (invitation.expiresAt.getTime() < now.getTime()) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true, cohortId: invitation.cohortId };
}

export async function validateInvitationToken(token: string): Promise<InvitationValidation> {
  const invitation = await prisma.invitationLink.findUnique({ where: { token } });
  return evaluateInvitation(invitation);
}
