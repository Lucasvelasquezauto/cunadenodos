import Link from "next/link";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { TalentFilterForm } from "@/components/TalentFilterForm";
import { buildTalentWhere } from "@/lib/talent";

export default async function GuestTalentPage({
  searchParams,
}: {
  searchParams: { school?: string; minExperience?: string; q?: string };
}) {
  const where = buildTalentWhere({
    school: searchParams.school,
    minExperience: searchParams.minExperience ? Number(searchParams.minExperience) : undefined,
    q: searchParams.q,
  });

  const profiles = await prisma.talentProfile.findMany({
    where,
    include: { owner: { select: { name: true } } },
    orderBy: { headline: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Talento</h1>

      <TalentFilterForm
        action="/invitado/talento"
        school={searchParams.school}
        minExperience={searchParams.minExperience}
        q={searchParams.q}
      />

      <ul className="mt-6 flex flex-col gap-3">
        {profiles.map((profile) => (
          <li key={profile.id}>
            <Link
              href={`/invitado/talento/${profile.id}`}
              className="card flex items-center gap-4 transition-colors hover:border-primary"
            >
              <Avatar name={profile.owner.name ?? profile.headline} imageUrl={profile.photoUrl} />
              <div>
                <p className="font-medium text-ink">{profile.owner.name}</p>
                <p className="text-sm text-gray-600">{profile.headline}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {profile.school} · {profile.experienceYears}{" "}
                  {profile.experienceYears === 1 ? "año" : "años"} de experiencia
                </p>
                <p className="mt-1 text-xs text-gray-500">{profile.experienceAreas}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {profiles.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          {searchParams.school || searchParams.minExperience || searchParams.q
            ? "Ningún perfil coincide con ese filtro."
            : "Todavía no hay perfiles registrados."}
        </p>
      )}
    </main>
  );
}
