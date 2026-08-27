import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/Avatar";

type Founder = { name: string; bio: string };

export default async function GuestCompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
  });

  if (!company) notFound();

  const founders = Array.isArray(company.founders)
    ? (company.founders as unknown as Founder[])
    : [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-4">
        <Avatar name={company.name} imageUrl={company.logoUrl} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-base text-gray-600">{company.tagline}</p>
          {company.sector && <p className="mt-1 text-xs text-gray-500">{company.sector}</p>}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <section>
          <h2 className="text-xl font-semibold">Qué hace</h2>
          <p className="mt-2 text-base">{company.description}</p>
        </section>

        {company.purpose && (
          <section>
            <h2 className="text-xl font-semibold">Propósito</h2>
            <p className="mt-2 text-base">{company.purpose}</p>
          </section>
        )}

        {company.values && (
          <section>
            <h2 className="text-xl font-semibold">Valores</h2>
            <p className="mt-2 text-base">{company.values}</p>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold">Propuesta de valor</h2>
          <p className="mt-2 text-base">{company.valueProp}</p>
        </section>

        {founders.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold">
              {founders.length === 1 ? "Fundador" : "Fundadores"}
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {founders.map((founder) => (
                <li key={founder.name} className="card">
                  <p className="font-medium text-ink">{founder.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{founder.bio}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-wrap gap-3">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Sitio web
            </a>
          )}
          {company.contactLinkPublic && company.contactLink && (
            <a
              href={company.contactLink}
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
