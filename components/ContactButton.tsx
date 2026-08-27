import Link from "next/link";
import type { ContactAccess } from "@/lib/messaging";

// La página que lo usa decide si el botón aplica siquiera (no se renderiza
// en el propio perfil) y calcula `access` con lib/messaging.ts#canContact —
// este componente solo se encarga de mostrarlo.
export function ContactButton({
  targetUserId,
  access,
}: {
  targetUserId: string;
  access: ContactAccess;
}) {
  if (access.allowed) {
    return (
      <Link href={`/mensajes/nueva?to=${targetUserId}`} className="btn-primary">
        Contactar
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-3 text-sm">
      <p className="text-gray-600">{access.reason}</p>
      {access.editHref && (
        <Link href={access.editHref} className="mt-1 inline-block font-medium text-primary hover:underline">
          Completar ahora
        </Link>
      )}
    </div>
  );
}
