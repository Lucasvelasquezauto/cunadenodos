import { ConversationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isCompanyComplete } from "@/lib/companies";
import { isProfileComplete } from "@/lib/talent";

const STATUS_LABELS: Record<ConversationStatus, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Activa",
  DECLINED: "Rechazada",
};

export default async function MetricasPage() {
  const [companies, profiles, conversations] = await Promise.all([
    prisma.company.findMany({
      select: { name: true, tagline: true, description: true, valueProp: true },
    }),
    prisma.talentProfile.findMany({
      select: { headline: true, experienceAreas: true, linkedinUrl: true },
    }),
    // Nunca se toca Message desde esta vista — ni un include, ni un count.
    // Institución también puede ver esta lista (con nombres reales, ya
    // decidido), nunca el contenido de los mensajes.
    prisma.conversation.findMany({
      include: {
        initiator: { select: { name: true, email: true } },
        recipient: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const companiesComplete = companies.filter(isCompanyComplete).length;
  const profilesComplete = profiles.filter(isProfileComplete).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Métricas</h1>

      <h2 className="mt-8 text-xl font-semibold">Completitud de datos</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card">
          <p className="text-3xl font-extrabold text-primary">
            {companiesComplete}/{companies.length}
          </p>
          <p className="mt-1 text-sm text-gray-600">empresas con perfil completo</p>
        </div>
        <div className="card">
          <p className="text-3xl font-extrabold text-primary">
            {profilesComplete}/{profiles.length}
          </p>
          <p className="mt-1 text-sm text-gray-600">perfiles de talento completos</p>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Conexiones</h2>
      <p className="mt-1 text-sm text-gray-600">
        Quién conversa con quién y en qué estado — el contenido de los mensajes es privado y no se
        muestra aquí.
      </p>

      {conversations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Todavía no hay conversaciones.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="card flex items-center justify-between gap-4">
              <p className="text-sm text-ink">
                {conversation.initiator.name ?? conversation.initiator.email}
                <span className="mx-2 text-gray-500">→</span>
                {conversation.recipient.name ?? conversation.recipient.email}
              </p>
              <span className="shrink-0 text-xs text-gray-500">
                {STATUS_LABELS[conversation.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
