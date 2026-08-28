import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cvResponseHeaders } from "@/lib/cv";

// Route handler, no pasa por app/(app)/layout.tsx (los layouts no envuelven
// route.ts) — por eso el chequeo de sesión se repite acá explícitamente.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", _request.url));
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
