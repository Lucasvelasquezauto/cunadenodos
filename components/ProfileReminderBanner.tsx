import Link from "next/link";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isCompanyComplete } from "@/lib/companies";
import { isProfileComplete } from "@/lib/talent";

// Informativo, nunca bloqueante — no redirige ni oculta navegación. La única
// acción que de verdad queda bloqueada por un perfil incompleto es
// "Contactar" (ya construido en messaging, vía lib/messaging.ts#canContact).
// Siempre visible mientras falte, sin botón para cerrarlo — decidido así
// explícitamente en SPEC-onboarding.md.
export async function ProfileReminderBanner() {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.role === Role.EMPRENDEDOR) {
    const company = await prisma.company.findUnique({ where: { ownerId: session.user.id } });
    if (company && isCompanyComplete(company)) return null;
    return (
      <div className="border-b border-gray-200 bg-warning-soft px-4 py-2.5 text-center text-sm text-warning">
        Todavía no completas el perfil de tu empresa —{" "}
        <Link href="/empresas/mia" className="font-medium underline">
          complétalo aquí
        </Link>
        .
      </div>
    );
  }

  if (session.user.role === Role.EMPLEABLE) {
    const profile = await prisma.talentProfile.findUnique({ where: { ownerId: session.user.id } });
    if (profile && isProfileComplete(profile)) return null;
    return (
      <div className="border-b border-gray-200 bg-warning-soft px-4 py-2.5 text-center text-sm text-warning">
        Todavía no completas tu perfil —{" "}
        <Link href="/perfil" className="font-medium underline">
          complétalo aquí
        </Link>
        .
      </div>
    );
  }

  return null;
}
