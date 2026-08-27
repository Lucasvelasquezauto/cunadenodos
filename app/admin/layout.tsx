import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { signOutAction } from "@/app/actions";

const NAV_LINKS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/cohorts", label: "Cohortes" },
  { href: "/admin/invitations", label: "Invitaciones" },
  { href: "/admin/settings", label: "Modo invitado" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (!hasRole(session.user, Role.ADMIN)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-200 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-6 text-sm">
          <Link href="/" aria-label="Ir al sitio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/beca-ser-andi.png" alt="Beca SER ANDI" className="h-6 w-auto" />
          </Link>
          <ul className="flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-gray-700 hover:text-primary hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
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
      {children}
    </div>
  );
}
