import Link from "next/link";
import { auth } from "@/lib/auth";
import { getGuestModeEnabled } from "@/lib/settings";
import { AppNav } from "@/components/AppNav";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { ProfileReminderBanner } from "@/components/ProfileReminderBanner";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  EMPRENDEDOR: "Emprendedor",
  EMPLEABLE: "Empleable",
  INSTITUCION: "Institución",
};

// Cifras del programa, no de uso de la plataforma (que arranca en cero) —
// indicativas hasta que EAFIT confirme los datos reales. Ver CAPABILITY-MAP.md.
const STATS = [
  { value: "+100", label: "personas formadas en la Beca SER ANDI" },
  { value: "30", label: "empresas en ruta de emprendimiento" },
  { value: "70", label: "personas en ruta de empleabilidad" },
];

// Sin esto, Next.js podría prerrenderizar en build y congelar el toggle de
// modo invitado del admin — mismo motivo que en /invitado.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const guestModeEnabled = session?.user ? false : await getGuestModeEnabled();

  return (
    <div className="min-h-screen">
      {session?.user && <AppNav role={session.user.role} userId={session.user.id} />}
      <ProfileReminderBanner />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-14 sm:pt-20">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/beca-ser-andi.png"
            alt="Beca SER ANDI — Inteligencia Artificial"
            className="mx-auto h-14 w-auto sm:h-16"
          />
          <h1 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold sm:text-4xl">
            El board de cierre de la <span className="text-primary">Beca SER ANDI</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
            Un espacio de contacto entre los emprendimientos y el talento formado en la Beca SER
            ANDI — Inteligencia Artificial, un programa de SER ANDI Fondo Social y ANDI Seccional
            Antioquia | Más País, operado por Universidad EAFIT y NODO.
          </p>

          {session?.user ? (
            <p className="mt-8 text-sm text-gray-700">
              Hola{session.user.org ? `, equipo ${session.user.org}` : ""} — sesión iniciada como{" "}
              <span className="font-medium">{session.user.email}</span> (
              {ROLE_LABELS[session.user.role] ?? session.user.role})
            </p>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login" className="btn-primary">
                Ingresar
              </Link>
              {guestModeEnabled && (
                <Link href="/invitado" className="btn-secondary">
                  Ver como invitado
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 border-t border-gray-200 pt-10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-gray-500 sm:text-left">
          Cifras del programa, indicativas hasta que EAFIT confirme los datos definitivos.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="card">
            <h2>Ruta de emprendimiento</h2>
            <p className="mt-2 text-sm text-gray-600">
              Empresas ya registradas en Cámara de Comercio, listas para posicionarse, encontrar
              clientes y tejer alianzas dentro de la red del programa.
            </p>
          </div>
          <div className="card">
            <h2>Ruta de empleabilidad</h2>
            <p className="mt-2 text-sm text-gray-600">
              Talento formado en la Beca SER ANDI en búsqueda de empleo o proyectos, con perfil
              profesional visible para toda la red.
            </p>
          </div>
        </div>
      </main>

      <InstitutionalFooter />
    </div>
  );
}
