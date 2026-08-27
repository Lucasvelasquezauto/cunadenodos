import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const correoNoRegistrado = searchParams.error === "AccessDenied";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Ingresar</h1>
        <p className="mt-2 text-sm text-gray-600">
          Escribe el correo con el que estás registrado en el programa. Te enviaremos un enlace
          de acceso, sin contraseña.
        </p>
      </div>

      {correoNoRegistrado && (
        <p
          role="alert"
          data-testid="login-error"
          className="rounded-lg bg-error-soft px-3.5 py-2.5 text-sm text-error"
        >
          Ese correo no está registrado en el programa. Si crees que deberías tener acceso,
          contacta al administrador, o si tienes un link de invitación, úsalo para crear tu
          cuenta.
        </p>
      )}

      <form
        action={async (formData) => {
          "use server";
          const email = formData.get("email");
          if (typeof email !== "string" || email.length === 0) return;
          try {
            await signIn("resend", { email, redirectTo: "/" });
          } catch (error) {
            if (error instanceof AuthError) {
              redirect(`/login?error=${error.type}`);
            }
            throw error;
          }
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="email"
          name="email"
          required
          placeholder="tu@correo.com"
          className="field"
        />
        <button
          type="submit"
          className="btn-primary"
        >
          Enviarme el enlace de acceso
        </button>
      </form>
    </main>
  );
}
