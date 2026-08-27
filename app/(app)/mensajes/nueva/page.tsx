import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canContact } from "@/lib/messaging";
import { Avatar } from "@/components/Avatar";
import { startConversation } from "./actions";

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: { to?: string; error?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const targetId = searchParams.to;
  if (!targetId) notFound();
  if (targetId === session.user.id) redirect("/");

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) notFound();

  const access = await canContact(session.user);

  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { initiatorId: session.user.id, recipientId: targetId },
        { initiatorId: targetId, recipientId: session.user.id },
      ],
    },
  });
  if (existing) redirect(`/mensajes/${existing.id}`);

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="flex items-center gap-3">
        <Avatar name={target.name ?? target.email} imageUrl={target.image} size="md" />
        <div>
          <p className="text-sm text-gray-500">Escribirle a</p>
          <h1 className="text-xl font-semibold">{target.name ?? target.email}</h1>
        </div>
      </div>

      {!access.allowed ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-surface p-4 text-sm">
          <p className="text-gray-600">{access.reason}</p>
          {access.editHref && (
            <a href={access.editHref} className="mt-1 inline-block font-medium text-primary hover:underline">
              Completar ahora
            </a>
          )}
        </div>
      ) : (
        <form action={startConversation} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="to" value={targetId} />
          <label htmlFor="body">Mensaje</label>
          <textarea
            id="body"
            name="body"
            required
            rows={5}
            placeholder="Contale por qué querés escribirle..."
            className="field"
          />
          {searchParams.error === "mensaje_vacio" && (
            <p role="alert" className="text-sm text-error">
              Escribe un mensaje antes de enviar la solicitud.
            </p>
          )}
          <button type="submit" className="btn-primary self-start">
            Enviar solicitud
          </button>
        </form>
      )}
    </main>
  );
}
