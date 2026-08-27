import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveMyCompany } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  faltan_campos: "Nombre, resumen, descripción y propuesta de valor son obligatorios.",
};

export default async function MyCompanyPage({
  searchParams,
}: {
  searchParams: { error?: string; guardado?: string };
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.EMPRENDEDOR) {
    redirect("/");
  }

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
  });

  const founders = Array.isArray(company?.founders)
    ? (company.founders as unknown as { name: string; bio: string }[])
    : [];

  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Mi empresa</h1>
      <p className="mt-2 text-base text-gray-600">
        Esta información se ve en el directorio de empresas — entre más completa, mejor.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-lg bg-error-soft px-3.5 py-2.5 text-sm text-error">
          {errorMessage}
        </p>
      )}
      {searchParams.guardado && (
        <p className="mt-4 rounded-lg bg-success-soft px-3.5 py-2.5 text-sm text-success">
          Guardado.
        </p>
      )}

      <form action={saveMyCompany} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name">Nombre de la empresa</label>
          <input id="name" name="name" required defaultValue={company?.name} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="tagline">Resumen corto (qué hace, en una línea)</label>
          <input id="tagline" name="tagline" required defaultValue={company?.tagline} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="sector">Sector</label>
          <input id="sector" name="sector" defaultValue={company?.sector ?? ""} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="description">Descripción — qué hace, a fondo</label>
          <textarea id="description" name="description" required rows={4} defaultValue={company?.description} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="purpose">Propósito</label>
          <textarea id="purpose" name="purpose" rows={2} defaultValue={company?.purpose ?? ""} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="values">Valores / principios</label>
          <textarea id="values" name="values" rows={2} defaultValue={company?.values ?? ""} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="valueProp">Propuesta de valor</label>
          <textarea id="valueProp" name="valueProp" required rows={2} defaultValue={company?.valueProp} className="field mt-1 w-full" />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-ink">
            Fundadores (opcional, hasta 3)
          </legend>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                name={`founder${i + 1}Name`}
                placeholder="Nombre"
                defaultValue={founders[i]?.name ?? ""}
                className="field"
              />
              <input
                name={`founder${i + 1}Bio`}
                placeholder="Background breve"
                defaultValue={founders[i]?.bio ?? ""}
                className="field"
              />
            </div>
          ))}
        </fieldset>

        <div>
          <label htmlFor="logoUrl">Logo (URL de imagen, opcional)</label>
          <input id="logoUrl" name="logoUrl" defaultValue={company?.logoUrl ?? ""} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="website">Sitio web (opcional)</label>
          <input id="website" name="website" defaultValue={company?.website ?? ""} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="contactLink">Link de contacto directo (opcional — WhatsApp, etc.)</label>
          <input id="contactLink" name="contactLink" defaultValue={company?.contactLink ?? ""} className="field mt-1 w-full" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="contactLinkPublic"
            defaultChecked={company?.contactLinkPublic ?? false}
          />
          Mostrar este link incluso a invitados no registrados
        </label>

        <button type="submit" className="btn-primary self-start">
          Guardar
        </button>
      </form>
    </main>
  );
}
