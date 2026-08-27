import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const credencialesInvalidas = searchParams.error === "CredentialsSignin";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Ingresar</h1>
        <p className="mt-2 text-sm text-gray-600">
          Escribe tu usuario o correo y tu contraseña para entrar al programa.
        </p>
      </div>

      {credencialesInvalidas && (
        <p
          role="alert"
          data-testid="login-error"
          className="rounded-lg bg-error-soft px-3.5 py-2.5 text-sm text-error"
        >
          Usuario o contraseña incorrectos. Si olvidaste tu contraseña, pide al
          administrador un link para restablecerla, o si tienes un link de invitación,
          úsalo para crear tu cuenta.
        </p>
      )}

      <form
        action={async (formData) => {
          "use server";
          const email = formData.get("email");
          const password = formData.get("password");
          if (typeof email !== "string" || typeof password !== "string") return;
          if (email.length === 0 || password.length === 0) return;
          try {
            await signIn("credentials", { email, password, redirect: false });
          } catch (error) {
            if (error instanceof AuthError) {
              redirect(`/login?error=${error.type}`);
            }
            throw error;
          }
          redirect("/");
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="text"
          name="email"
          required
          placeholder="Usuario o correo"
          className="field"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Contraseña"
          className="field"
        />
        <button
          type="submit"
          className="btn-primary"
        >
          Ingresar
        </button>
      </form>
    </main>
  );
}
