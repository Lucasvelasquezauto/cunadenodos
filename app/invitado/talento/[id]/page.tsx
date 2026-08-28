import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { serializeTalentProfile } from "@/lib/talent";
import { Avatar } from "@/components/Avatar";

export default async function GuestTalentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const record = await prisma.talentProfile.findUnique({
    where: { id: params.id },
    include: { owner: { select: { name: true } } },
  });

  if (!record) notFound();

  // Redacción a nivel de datos, no de render — ver lib/talent.ts. viewer es
  // siempre null aquí: un invitado nunca ve isEmployed/isSeekingWork, sin
  // importar employmentStatusVisible.
  const profile = serializeTalentProfile(record, null);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-4">
        <Avatar name={profile.owner.name ?? profile.headline} imageUrl={profile.photoUrl} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold">{profile.owner.name}</h1>
          <p className="text-base text-gray-600">{profile.headline}</p>
          <p className="text-sm text-gray-500">
            {profile.school} · {profile.experienceYears}{" "}
            {profile.experienceYears === 1 ? "año" : "años"} de experiencia
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <section>
          <h2 className="text-xl font-semibold">Áreas de experiencia</h2>
          <p className="mt-2 text-base">{profile.experienceAreas}</p>
        </section>

        {profile.postgraduates && (
          <section>
            <h2 className="text-xl font-semibold">Posgrados</h2>
            <p className="mt-2 text-base">{profile.postgraduates}</p>
          </section>
        )}

        {profile.motivations && (
          <section>
            <h2 className="text-xl font-semibold">Qué está buscando</h2>
            <p className="mt-2 text-base">{profile.motivations}</p>
          </section>
        )}

        {(profile.isEmployed !== null || profile.isSeekingWork !== null) && (
          <section>
            <h2 className="text-xl font-semibold">Estado</h2>
            <p className="mt-2 text-base">
              {profile.isEmployed === true && "Actualmente empleado. "}
              {profile.isEmployed === false && "Actualmente sin empleo. "}
              {profile.isSeekingWork === true && "Buscando empleo o proyectos."}
              {profile.isSeekingWork === false && "No está buscando activamente."}
            </p>
          </section>
        )}

        <section className="flex flex-wrap gap-3">
          <a
            href={profile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            LinkedIn
          </a>
          {profile.cvFileName && (
            <a href={`/invitado/talento/${record.id}/cv`} className="btn-secondary">
              Descargar hoja de vida
            </a>
          )}
          {profile.contactLinkPublic && profile.contactLink && (
            <a
              href={profile.contactLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Contacto directo
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
