import Link from "next/link";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/Avatar";

export default async function GuestCompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Empresas</h1>

      <ul className="mt-6 flex flex-col gap-3">
        {companies.map((company) => (
          <li key={company.id}>
            <Link
              href={`/invitado/empresas/${company.id}`}
              className="card flex items-center gap-4 transition-colors hover:border-primary"
            >
              <Avatar name={company.name} imageUrl={company.logoUrl} />
              <div>
                <p className="font-medium text-ink">{company.name}</p>
                <p className="text-sm text-gray-600">{company.tagline}</p>
                {company.sector && (
                  <p className="mt-1 text-xs text-gray-500">{company.sector}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {companies.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">Todavía no hay empresas registradas.</p>
      )}
    </main>
  );
}
