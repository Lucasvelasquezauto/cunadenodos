import Link from "next/link";

export default function InvitadoHomePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 text-center">
      <h1 className="text-3xl font-extrabold">Cuna de Nodos — vista de invitado</h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
        Presentación de los emprendimientos y el talento formado en la Beca SER ANDI, dirigida a
        actores externos que buscan soluciones e integración con el ecosistema de Inteligencia
        Artificial.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link href="/invitado/empresas" className="card text-left hover:border-primary">
          <h2>Empresas</h2>
          <p className="mt-2 text-sm text-gray-600">
            Los emprendimientos de la ruta de emprendimiento del programa.
          </p>
        </Link>
        <Link href="/invitado/talento" className="card text-left hover:border-primary">
          <h2>Talento</h2>
          <p className="mt-2 text-sm text-gray-600">
            Las personas en búsqueda de empleo o proyectos de la ruta de empleabilidad.
          </p>
        </Link>
      </div>
    </main>
  );
}
