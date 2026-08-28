import { getGuestModeAudit, getGuestModeEnabled } from "@/lib/settings";
import { toggleGuestMode } from "./actions";

export default async function SettingsPage() {
  const guestModeEnabled = await getGuestModeEnabled();
  const { changedBy, changedAt } = await getGuestModeAudit();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Modo invitado</h1>
      <p className="mt-2 text-sm text-gray-600">
        Actívalo para presentar el sitio a invitados no registrados (ej. en una feria de empleo).
        Muestra una vista resumida, sin datos sensibles.
      </p>
      <p className="mt-4 text-sm">
        Estado actual:{" "}
        <span className={guestModeEnabled ? "font-medium text-success" : "font-medium text-gray-500"}>
          {guestModeEnabled ? "Activo" : "Inactivo"}
        </span>
      </p>
      {changedBy && changedAt && (
        <p className="mt-1 text-xs text-gray-500">
          Último cambio: {changedBy} el{" "}
          {changedAt.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}

      <form action={toggleGuestMode} className="mt-4 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="guestModeEnabled" defaultChecked={guestModeEnabled} />
          Modo invitado activo
        </label>
        <button
          type="submit"
          className="btn-primary"
        >
          Guardar
        </button>
      </form>
    </main>
  );
}
