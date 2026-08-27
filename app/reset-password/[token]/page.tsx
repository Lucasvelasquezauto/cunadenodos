import { validateResetToken } from "@/lib/passwords";
import { setNewPassword } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  weak_password: "La contraseña debe tener al menos 8 caracteres.",
  password_mismatch: "Las contraseñas no coinciden.",
  invalid_token: "Este link ya no es válido. Pide al administrador uno nuevo.",
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const validation = await validateResetToken(params.token);

  if (!validation.valid) {
    const reasonText =
      validation.reason === "expired"
        ? "Este link ya venció."
        : validation.reason === "used"
          ? "Este link ya se usó."
          : "Este link no existe.";
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Link no válido</h1>
        <p className="text-sm text-gray-600">
          {reasonText} Pide al administrador del programa uno nuevo.
        </p>
      </main>
    );
  }

  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Elige tu nueva contraseña</h1>
        <p className="mt-2 text-sm text-gray-600">
          Este link se puede usar una sola vez.
        </p>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-error-soft px-3.5 py-2.5 text-sm text-error">
          {errorMessage}
        </p>
      )}

      <form
        action={setNewPassword.bind(null, params.token)}
        className="flex flex-col gap-3"
      >
        <input
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="Contraseña nueva (mínimo 8 caracteres)"
          className="field"
        />
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          placeholder="Confirma tu contraseña"
          className="field"
        />
        <button type="submit" className="btn-primary">
          Guardar contraseña
        </button>
      </form>
    </main>
  );
}
