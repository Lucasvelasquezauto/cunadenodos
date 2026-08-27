import Link from "next/link";
import { redirect } from "next/navigation";
import { ConversationStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/Avatar";

const STATUS_LABELS: Record<ConversationStatus, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Activa",
  DECLINED: "Rechazada",
};

export default async function MessagesInboxPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ initiatorId: session.user.id }, { recipientId: session.user.id }],
    },
    include: {
      initiator: { select: { id: true, name: true, email: true, image: true } },
      recipient: { select: { id: true, name: true, email: true, image: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Mensajes</h1>

      {conversations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">
          Todavía no tienes conversaciones. Contacta a alguien desde su perfil en el directorio.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {conversations.map((conversation) => {
            const other =
              conversation.initiatorId === session.user.id
                ? conversation.recipient
                : conversation.initiator;
            const lastMessage = conversation.messages[0];
            const unread = Boolean(
              lastMessage && lastMessage.senderId !== session.user.id && !lastMessage.readAt,
            );

            return (
              <li key={conversation.id}>
                <Link
                  href={`/mensajes/${conversation.id}`}
                  className="card flex items-center gap-4 hover:border-primary"
                >
                  <Avatar name={other.name ?? other.email} imageUrl={other.image} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{other.name ?? other.email}</p>
                      {unread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="No leído" />
                      )}
                    </div>
                    <p className="truncate text-sm text-gray-600">
                      {lastMessage ? lastMessage.body : "Sin mensajes todavía"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">
                    {STATUS_LABELS[conversation.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
