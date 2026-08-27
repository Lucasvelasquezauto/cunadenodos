import { validateInvitationToken } from "@/lib/invitations";
import { joinWithInvitation } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_email: "Escribe un correo válido.",
  missing_track: "Selecciona tu ruta (emprendimiento o empleabilidad).",
  missing_consent: "Debes aceptar los dos consentimientos para crear tu cuenta.",
  weak_password: "La contraseña debe tener al menos 8 caracteres.",
  password_mismatch: "Las contraseñas no coinciden.",
  already_registered:
    "Ese correo ya tiene una cuenta creada. Ve a la pantalla de ingreso para entrar con tu contraseña.",
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const validation = await validateInvitationToken(params.token);

  if (!validation.valid) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Link no válido</h1>
        <p className="text-sm text-gray-600">
          {validation.reason === "expired"
            ? "Este link de invitación ya venció."
            : "Este link de invitación no existe."}{" "}
          Contacta al administrador del programa para conseguir uno nuevo.
        </p>
      </main>
    );
  }

  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Crea tu cuenta</h1>
        <p className="mt-2 text-sm text-gray-600">
          Escribe tu correo, elige tu ruta en el programa y crea tu contraseña. La vas a
          necesitar cada vez que vuelvas a entrar.
        </p>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-error-soft px-3.5 py-2.5 text-sm text-error">
          {errorMessage}
        </p>
      )}

      <form action={joinWithInvitation.bind(null, params.token)} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          required
          placeholder="tu@correo.com"
          className="field"
        />
        <input
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="Contraseña (mínimo 8 caracteres)"
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
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-medium">Tu ruta en el programa</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="track" value="EMPRENDEDOR" required />
            Emprendimiento
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="track" value="EMPLEABLE" />
            Empleabilidad
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3 text-sm">
          <legend className="mb-1 font-medium">Consentimiento</legend>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="consentDataProcessing" required className="mt-1" />
            <span className="text-gray-600">
              Autorizo el tratamiento de mis datos personales, conforme a la Ley 1581 de 2012 y el
              Decreto 1377 de 2013, para los fines propios de mi participación en la Beca SER
              ANDI: contacto, comunicación y seguimiento dentro del programa.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="consentDirectory" required className="mt-1" />
            <span className="text-gray-600">
              Autorizo que la información de mi perfil (nombre, empresa o experiencia, y los demás
              datos que decida compartir) sea visible para los demás participantes del programa,
              la Universidad EAFIT y ANDI dentro de esta plataforma, incluyendo su presentación en
              ferias u otros eventos gremiales o de empleo relacionados con la Beca SER ANDI.
            </span>
          </label>
        </fieldset>

        <button
          type="submit"
          className="btn-primary"
        >
          Continuar
        </button>
      </form>
    </main>
  );
}
