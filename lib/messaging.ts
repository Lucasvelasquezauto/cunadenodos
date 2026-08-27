import { Role } from "@prisma/client";
import { prisma } from "./db";
import { isCompanyComplete } from "./companies";
import { isProfileComplete } from "./talent";

type Viewer = { id: string; role: Role };

// Un mismo par de personas tiene una sola conversación, sin importar quién
// contactó primero — busca en ambas direcciones antes de crear.
export async function findOrCreateConversation(initiatorId: string, recipientId: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { initiatorId, recipientId },
        { initiatorId: recipientId, recipientId: initiatorId },
      ],
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { initiatorId, recipientId },
  });
}

export function canViewConversation(
  conversation: { initiatorId: string; recipientId: string },
  viewerId: string,
): boolean {
  return conversation.initiatorId === viewerId || conversation.recipientId === viewerId;
}

export type ContactAccess =
  | { allowed: true }
  | { allowed: false; reason: string; editHref?: string };

// El gate de completitud (CAPABILITY-MAP.md: "sin muro de onboarding... lo
// que sí queda bloqueado es la acción de contactar") solo aplica a
// emprendedor/empleable — institución y admin no tienen perfil que
// completar, así que siempre pueden contactar.
export async function canContact(viewer: Viewer): Promise<ContactAccess> {
  if (viewer.role === Role.EMPRENDEDOR) {
    const company = await prisma.company.findUnique({ where: { ownerId: viewer.id } });
    if (!company || !isCompanyComplete(company)) {
      return {
        allowed: false,
        reason: "Completa el perfil de tu empresa antes de poder contactar a alguien.",
        editHref: "/empresas/mia",
      };
    }
  }
  if (viewer.role === Role.EMPLEABLE) {
    const profile = await prisma.talentProfile.findUnique({ where: { ownerId: viewer.id } });
    if (!profile || !isProfileComplete(profile)) {
      return {
        allowed: false,
        reason: "Completa tu perfil antes de poder contactar a alguien.",
        editHref: "/perfil",
      };
    }
  }
  return { allowed: true };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: {
        OR: [{ initiatorId: userId }, { recipientId: userId }],
      },
    },
  });
}
