import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Chequeo optimista y barato (runtime Edge, sin acceso a la base de datos):
// solo verifica que exista ALGUNA cookie de sesión. La verificación real de
// rol ocurre en app/(admin)/layout.tsx (Node.js runtime, sí puede usar Prisma).
// Ver "Decisions Log" en SPEC-identity.md para el porqué de este patrón.
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

export function middleware(request: NextRequest) {
  if (!hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
