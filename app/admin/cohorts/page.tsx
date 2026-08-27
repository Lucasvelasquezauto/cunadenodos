import { prisma } from "@/lib/db";
import { createCohort } from "./actions";

export default async function CohortsPage() {
  const cohorts = await prisma.cohort.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Cohortes</h1>

      <form
        action={createCohort}
        className="mt-6 flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <h2 className="text-sm font-medium">Nueva cohorte</h2>
        <input
          name="name"
          required
          placeholder="Nombre (ej. Cohorte 2026-2)"
          className="field"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked /> Activa
        </label>
        <button
          type="submit"
          className="btn-primary self-start"
        >
          Crear cohorte
        </button>
      </form>

      <ul className="mt-6 divide-y divide-gray-200">
        {cohorts.map((cohort) => (
          <li key={cohort.id} className="flex items-center justify-between py-3 text-sm">
            <span>{cohort.name}</span>
            <span className={cohort.isActive ? "text-success font-medium" : "text-gray-500"}>
              {cohort.isActive ? "Activa" : "Inactiva"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
