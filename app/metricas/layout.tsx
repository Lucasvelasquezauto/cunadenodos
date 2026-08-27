import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { AppNav } from "@/components/AppNav";

// Protección real: este layout corre en el servidor antes de mandar
// cualquier HTML — mismo patrón que app/admin/layout.tsx y
// app/(app)/layout.tsx. No hace falta tocar middleware.ts ni
// lib/permissions.ts#canAccessRoute (ese helper no protege nada hoy, ver
// tasks/plan-admin-dashboard.md).
export default async function MetricasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (!hasRole(session.user, Role.ADMIN) && !hasRole(session.user, Role.INSTITUCION)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <AppNav role={session.user.role} userId={session.user.id} />
      {children}
    </div>
  );
}
