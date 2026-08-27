import { NextResponse } from "next/server";
import { getLastGeneratedLink } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Endpoint exclusivo para los tests e2e (Playwright), para leer el magic link
// que se acaba de generar sin depender de un correo real ni de la consola del
// servidor. Doble candado: nunca responde en producción, y siempre exige el
// secreto compartido — así no se convierte en una puerta de acceso real.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }

  const secret = request.headers.get("x-e2e-secret");
  if (!secret || secret !== process.env.E2E_TEST_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email requerido" }, { status: 400 });
  }

  return NextResponse.json({ link: await getLastGeneratedLink(email) });
}
