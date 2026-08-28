import { TALENT_SCHOOLS } from "@/lib/talent";

// Formulario GET puro (sin JS) — reusado por /talento y /invitado/talento,
// que leen los mismos query params y arman el where con buildTalentWhere().
export function TalentFilterForm({
  action,
  school,
  minExperience,
  q,
}: {
  action: string;
  school?: string;
  minExperience?: string;
  q?: string;
}) {
  const hasFilters = Boolean(school || minExperience || q);

  return (
    <form
      method="get"
      action={action}
      className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4"
    >
      <div>
        <label htmlFor="school" className="block text-xs font-medium text-gray-600">
          Escuela de formación
        </label>
        <select id="school" name="school" defaultValue={school ?? ""} className="field mt-1">
          <option value="">Todas</option>
          {TALENT_SCHOOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="minExperience" className="block text-xs font-medium text-gray-600">
          Años de experiencia (mínimo)
        </label>
        <input
          id="minExperience"
          name="minExperience"
          type="number"
          min={0}
          max={60}
          defaultValue={minExperience ?? ""}
          className="field mt-1 w-28"
        />
      </div>
      <div className="min-w-[200px] flex-1">
        <label htmlFor="q" className="block text-xs font-medium text-gray-600">
          Buscar (profesión, áreas, motivaciones)
        </label>
        <input
          id="q"
          name="q"
          type="text"
          defaultValue={q ?? ""}
          className="field mt-1 w-full"
        />
      </div>
      <button type="submit" className="btn-secondary">
        Filtrar
      </button>
      {hasFilters && (
        <a href={action} className="text-sm text-gray-500 hover:underline">
          Limpiar filtros
        </a>
      )}
    </form>
  );
}
