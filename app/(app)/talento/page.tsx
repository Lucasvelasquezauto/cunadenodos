import Link from "next/link";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/Avatar";

export default async function TalentPage() {
  const profiles = await prisma.talentProfile.findMany({
    include: { owner: { select: { name: true } } },
    orderBy: { headline: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Talento</h1>

      <ul className="mt-6 flex flex-col gap-3">
        {profiles.map((profile) => (
          <li key={profile.id}>
            <Link
              href={`/talento/${profile.id}`}
              className="card flex items-center gap-4 transition-colors hover:border-primary"
            >
              <Avatar name={profile.owner.name ?? profile.headline} imageUrl={profile.photoUrl} />
              <div>
                <p className="font-medium text-ink">{profile.owner.name}</p>
                <p className="text-sm text-gray-600">{profile.headline}</p>
                <p className="mt-1 text-xs text-gray-500">{profile.experienceAreas}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {profiles.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">Todavía no hay perfiles registrados.</p>
      )}
    </main>
  );
}
