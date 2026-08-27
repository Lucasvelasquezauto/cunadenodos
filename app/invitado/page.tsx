import Link from "next/link";

export default function InvitadoHomePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 text-center">
      <h1 className="text-3xl font-extrabold">Board SER ANDI — vista de invitado</h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
        Una vista resumida de los emprendimientos y el talento de la Beca SER ANDI, pensada para
        quien todavía no tiene cuenta — por ejemplo, en una feria. Si ya formas parte del programa,
        ingresa con tu cuenta para ver los perfiles completos y escribirle a quien quieras.
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
