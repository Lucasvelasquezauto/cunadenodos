import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestModeEnabled } from "@/lib/settings";
import { cvResponseHeaders } from "@/lib/cv";

// Route handler, no pasa por app/invitado/layout.tsx — el chequeo de modo
// invitado se repite acá explícitamente (mismo motivo que la versión con
// sesión en app/(app)/talento/[id]/cv/route.ts).
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const guestModeEnabled = await getGuestModeEnabled();
  if (!guestModeEnabled) {
    return new NextResponse("No disponible", { status: 404 });
  }

  const profile = await prisma.talentProfile.findUnique({
    where: { id: params.id },
    select: { cvFile: true, cvFileName: true, cvMimeType: true },
  });

  if (!profile?.cvFile || !profile.cvFileName) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  return new NextResponse(profile.cvFile, {
    headers: cvResponseHeaders(profile.cvFileName, profile.cvMimeType),
  });
}
