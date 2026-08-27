import { prisma } from "@/lib/db";
import { GenerateAndCopy } from "@/components/GenerateAndCopy";
import { generateInvitationLink } from "./actions";

export default async function InvitationsPage() {
  const cohorts = await prisma.cohort.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Links de invitación</h1>
      <p className="mt-2 text-sm text-gray-600">
        Genera un link por cohorte y compártelo por tu propio correo o canal — quien entre con
        él crea su cuenta y queda listo para diligenciar su perfil. El link vence a los 30 días.
      </p>

      <ul className="mt-6 flex flex-col gap-6">
        {cohorts.map((cohort) => (
          <li key={cohort.id} className="rounded-md border border-gray-200 p-4">
            <h2 className="text-sm font-medium">{cohort.name}</h2>
            <div className="mt-3">
              <GenerateAndCopy
                label="Generar link de invitación"
                action={generateInvitationLink.bind(null, cohort.id)}
              />
            </div>
          </li>
        ))}
      </ul>

      {cohorts.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          No hay cohortes activas todavía. Crea una en la sección Cohortes.
        </p>
      )}
    </main>
  );
}
