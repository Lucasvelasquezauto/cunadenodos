import Link from "next/link";
import { Role } from "@prisma/client";
import { signOutAction } from "@/app/actions";
import { getUnreadCount } from "@/lib/messaging";

export async function AppNav({ role, userId }: { role: Role; userId: string }) {
  const unreadCount = await getUnreadCount(userId);

  const links = [
    { href: "/empresas", label: "Empresas" },
    { href: "/talento", label: "Talento" },
  ];
  if (role === Role.EMPRENDEDOR) {
    links.push({ href: "/empresas/mia", label: "Mi empresa" });
  }
  if (role === Role.EMPLEABLE) {
    links.push({ href: "/perfil", label: "Mi perfil" });
  }
  if (role === Role.ADMIN || role === Role.INSTITUCION) {
    links.push({ href: "/metricas", label: "Métricas" });
  }
  if (role === Role.ADMIN) {
    links.push({ href: "/admin", label: "Panel admin" });
  }

  return (
    <nav className="border-b border-gray-200 px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center gap-6 text-sm">
        <Link href="/" aria-label="Inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/beca-ser-andi.png" alt="Beca SER ANDI" className="h-6 w-auto" />
        </Link>
        <ul className="flex items-center gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-gray-700 hover:text-primary hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/mensajes"
              className="inline-flex items-center gap-1.5 text-gray-700 hover:text-primary hover:underline"
            >
              Mensajes
              {unreadCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-bg">
                  {unreadCount}
                </span>
              )}
            </Link>
          </li>
        </ul>
        <form action={signOutAction} className="ml-auto">
          <button
            type="submit"
            className="text-gray-500 hover:text-primary hover:underline"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  );
}
