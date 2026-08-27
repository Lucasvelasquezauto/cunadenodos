import { notFound, redirect } from "next/navigation";
import { ConversationStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewConversation } from "@/lib/messaging";
import { Avatar } from "@/components/Avatar";
import { sendMessage, acceptConversation, declineConversation } from "./actions";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      initiator: { select: { id: true, name: true, email: true, image: true } },
      recipient: { select: { id: true, name: true, email: true, image: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  // No revelar si la conversación existe a quien no es parte de ella — mismo
  // criterio de "never" del spec: ni admin ni institución la ven en v1.
  if (!conversation || !canViewConversation(conversation, session.user.id)) {
    notFound();
  }

  const viewerId = session.user.id;
  const isInitiator = conversation.initiatorId === viewerId;
  const other = isInitiator ? conversation.recipient : conversation.initiator;

  // Efecto de página vista, no una acción de usuario — se resuelve aquí en
  // vez de en un Server Action dedicado para no sumar una ruta extra solo
  // para esto.
  const unreadIds = conversation.messages
    .filter((m) => m.senderId !== viewerId && !m.readAt)
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: unreadIds } },
      data: { readAt: new Date() },
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <Avatar name={other.name ?? other.email} imageUrl={other.image} size="md" />
        <h1 className="text-xl font-semibold">{other.name ?? other.email}</h1>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {conversation.messages.map((message) => {
          const isMine = message.senderId === viewerId;
          return (
            <li
              key={message.id}
              className={`max-w-[80%] rounded-xl border border-gray-200 p-3 text-sm ${
                isMine ? "self-end bg-primary text-bg" : "self-start bg-surface text-ink"
              }`}
            >
              {message.body}
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        {conversation.status === ConversationStatus.PENDING && !isInitiator && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              {other.name ?? other.email} te quiere contactar. ¿Aceptas la solicitud?
            </p>
            <div className="flex gap-3">
              <form action={acceptConversation}>
                <input type="hidden" name="conversationId" value={conversation.id} />
                <button type="submit" className="btn-primary">
                  Aceptar
                </button>
              </form>
              <form action={declineConversation}>
                <input type="hidden" name="conversationId" value={conversation.id} />
                <button type="submit" className="btn-secondary">
                  Rechazar
                </button>
              </form>
            </div>
          </div>
        )}

        {conversation.status === ConversationStatus.PENDING && isInitiator && (
          <p className="text-sm text-gray-600">
            Esperando respuesta de {other.name ?? other.email}.
          </p>
        )}

        {conversation.status === ConversationStatus.ACCEPTED && (
          <form action={sendMessage} className="flex flex-col gap-3">
            <input type="hidden" name="conversationId" value={conversation.id} />
            <label htmlFor="body" className="sr-only">
              Mensaje
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={3}
              placeholder="Escribe un mensaje..."
              className="field"
            />
            <button type="submit" className="btn-primary self-start">
              Enviar
            </button>
          </form>
        )}

        {conversation.status === ConversationStatus.DECLINED && (
          <p className="text-sm text-gray-500">Esta conversación fue rechazada.</p>
        )}
      </div>
    </main>
  );
}
