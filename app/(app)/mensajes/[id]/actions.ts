"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ConversationStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewConversation } from "@/lib/messaging";

async function requireParticipant(conversationId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || !canViewConversation(conversation, session.user.id)) {
    redirect("/mensajes");
  }
  return { userId: session.user.id, conversation };
}

export async function sendMessage(formData: FormData) {
  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string") redirect("/mensajes");
  const { userId, conversation } = await requireParticipant(conversationId);

  if (conversation.status !== ConversationStatus.ACCEPTED) {
    redirect(`/mensajes/${conversationId}`);
  }

  const body = formData.get("body");
  if (typeof body !== "string" || !body.trim()) {
    redirect(`/mensajes/${conversationId}`);
  }

  await prisma.message.create({
    data: { conversationId, senderId: userId, body: body.trim() },
  });
  // @updatedAt solo se actualiza solo si Prisma detecta un cambio de campo en
  // esta escritura — como Message es un modelo aparte, hay que tocarlo a
  // mano para que la conversación suba al tope del inbox ordenado por
  // actividad reciente.
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/mensajes");
  // Un form action que no redirige deja la vista sin refrescar cuando el
  // envío llega como un POST nativo (sin la interceptación cliente de
  // Next.js) — mismo motivo que saveMyCompany en empresas/mia/actions.ts
  // redirige en vez de solo revalidar. Redirigir a la misma conversación
  // fuerza un render fresco de verdad.
  redirect(`/mensajes/${conversationId}`);
}

export async function acceptConversation(formData: FormData) {
  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string") redirect("/mensajes");
  const { userId, conversation } = await requireParticipant(conversationId);

  if (conversation.recipientId !== userId || conversation.status !== ConversationStatus.PENDING) {
    redirect(`/mensajes/${conversationId}`);
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: ConversationStatus.ACCEPTED },
  });

  revalidatePath("/mensajes");
  redirect(`/mensajes/${conversationId}`);
}

export async function declineConversation(formData: FormData) {
  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string") redirect("/mensajes");
  const { userId, conversation } = await requireParticipant(conversationId);

  if (conversation.recipientId !== userId || conversation.status !== ConversationStatus.PENDING) {
    redirect(`/mensajes/${conversationId}`);
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: ConversationStatus.DECLINED },
  });

  revalidatePath("/mensajes");
  redirect(`/mensajes/${conversationId}`);
}
