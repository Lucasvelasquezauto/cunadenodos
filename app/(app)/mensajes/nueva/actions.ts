"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canContact, findOrCreateConversation } from "@/lib/messaging";

export async function startConversation(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const to = formData.get("to");
  const body = formData.get("body");
  if (typeof to !== "string" || !to) redirect("/");
  if (to === session.user.id) redirect("/");

  if (typeof body !== "string" || !body.trim()) {
    redirect(`/mensajes/nueva?to=${to}&error=mensaje_vacio`);
  }

  const access = await canContact(session.user);
  if (!access.allowed) redirect("/");

  const target = await prisma.user.findUnique({ where: { id: to } });
  if (!target) redirect("/");

  const conversation = await findOrCreateConversation(session.user.id, to);

  // Si la conversación ya existía con mensajes (otra pestaña, doble envío),
  // no duplicar la solicitud — solo entrar al hilo existente.
  const messageCount = await prisma.message.count({
    where: { conversationId: conversation.id },
  });
  if (messageCount === 0) {
    await prisma.message.create({
      data: { conversationId: conversation.id, senderId: session.user.id, body: body.trim() },
    });
  }

  redirect(`/mensajes/${conversation.id}`);
}
