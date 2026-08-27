import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";

// El adapter base de Auth.js no es idempotente al borrar una sesión que ya no
// existe (ej. si el admin acaba de eliminar la cuenta mientras el navegador
// todavía tenía la cookie vieja) — sin este parche, esa carrera tumba el login
// con un error sin capturar en vez de tratarse como "ya no había sesión".
const baseAdapter = PrismaAdapter(prisma);
const adapter = {
  ...baseAdapter,
  async deleteSession(sessionToken: string): Promise<void> {
    try {
      await baseAdapter.deleteSession?.(sessionToken);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return;
      }
      throw error;
    }
  },
};

// Guarda el último link generado por correo, para que el admin lo pueda
// copiar manualmente desde el panel como respaldo si el envío automático no
// llega. Persistido en DB (ver comentario en prisma/schema.prisma) — una
// variable en memoria no sobrevive entre requests separados de forma
// confiable, ni en Next.js dev (capas de compilación separadas) ni en
// serverless (instancias distintas).
export async function getLastGeneratedLink(email: string): Promise<string | null> {
  const entry = await prisma.lastLinkCache.findUnique({ where: { email } });
  if (entry && Date.now() - entry.createdAt.getTime() < 60_000) {
    return entry.url;
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/login",
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        await prisma.lastLinkCache.upsert({
          where: { email: identifier },
          update: { url, createdAt: new Date() },
          create: { email: identifier, url },
        });

        if (process.env.NODE_ENV !== "production") {
          console.log(`\n[dev] Magic link para ${identifier}:\n${url}\n`);
          return;
        }
        const { Resend: ResendClient } = await import("resend");
        const resend = new ResendClient(provider.apiKey);
        await resend.emails.send({
          from: provider.from as string,
          to: identifier,
          subject: "Tu acceso al Board SER ANDI",
          html: `<p>Hola,</p><p>Haz clic para entrar al Board SER ANDI:</p><p><a href="${url}">${url}</a></p><p>Si no esperabas este correo, ignóralo.</p>`,
        });
      },
    }),
  ],
  callbacks: {
    // Puerta cerrada de /login: solo correos que ya existen como User pueden
    // recibir el magic link. La creación de cuentas nuevas ocurre únicamente
    // vía /invite/[token] (módulo identity, ver SPEC-identity.md).
    async signIn({ user }) {
      if (!user?.email) return false;
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });
      return Boolean(existing);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.org = user.org;
        session.user.cohortId = user.cohortId;
      }
      return session;
    },
  },
});
