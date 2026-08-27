import Link from "next/link";
import { getGuestModeEnabled } from "@/lib/settings";

// Sin esto, Next.js podría prerrenderizar en build y congelar el toggle de
// modo invitado del admin — mismo motivo que en el resto de rutas que leen
// getGuestModeEnabled().
export const dynamic = "force-dynamic";

export default async function InvitadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guestModeEnabled = await getGuestModeEnabled();

  if (!guestModeEnabled) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="text-xl font-semibold">No disponible</h1>
        <p className="mt-2 text-sm text-gray-600">
          El modo invitado está desactivado por ahora.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-200 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-6 text-sm">
          <Link href="/invitado" aria-label="Inicio invitado">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/beca-ser-andi.png" alt="Beca SER ANDI" className="h-6 w-auto" />
          </Link>
          <ul className="flex items-center gap-4">
            <li>
              <Link href="/invitado/empresas" className="text-gray-700 hover:text-primary hover:underline">
                Empresas
              </Link>
            </li>
            <li>
              <Link href="/invitado/talento" className="text-gray-700 hover:text-primary hover:underline">
                Talento
              </Link>
            </li>
          </ul>
          <Link href="/login" className="ml-auto text-gray-500 hover:text-primary hover:underline">
            Ingresar
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
