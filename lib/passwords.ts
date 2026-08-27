import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const RESET_TOKEN_EXPIRY_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createPasswordResetToken(userId: string) {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return prisma.passwordResetToken.create({
    data: { token, userId, expiresAt },
  });
}

export type ResetTokenValidation =
  | { valid: true; userId: string }
  | { valid: false; reason: "not_found" | "expired" | "used" };

type ResetTokenRecord = { userId: string; expiresAt: Date; usedAt: Date | null } | null;

// Lógica pura, separada del acceso a datos, para poder probarla sin una DB real.
export function evaluateResetToken(
  record: ResetTokenRecord,
  now: Date = new Date(),
): ResetTokenValidation {
  if (!record) return { valid: false, reason: "not_found" };
  if (record.usedAt) return { valid: false, reason: "used" };
  if (record.expiresAt.getTime() < now.getTime()) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true, userId: record.userId };
}

export async function validateResetToken(token: string): Promise<ResetTokenValidation> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  return evaluateResetToken(record);
}

export async function consumeResetToken(token: string, newPassword: string): Promise<boolean> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  const validation = evaluateResetToken(record);
  if (!validation.valid) return false;

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: validation.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);
  return true;
}
