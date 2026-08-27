import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { ProfileReminderBanner } from "@/components/ProfileReminderBanner";

// Ojo: "/" NO vive en este grupo — la portada pública tiene que seguir
// alcanzable sin sesión (contexto institucional + botón Ingresar), y este
// layout redirige a /login a cualquiera sin sesión. Solo las páginas que de
// verdad requieren cuenta (Empresas, Talento, Mi perfil, Mi empresa) van aquí.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <AppNav role={session.user.role} userId={session.user.id} />
      <ProfileReminderBanner />
      {children}
    </div>
  );
}
