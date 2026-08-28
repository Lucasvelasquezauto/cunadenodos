import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TALENT_SCHOOLS } from "@/lib/talent";
import { saveMyProfile, deleteMyCv } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  faltan_campos: "Profesión, escuela, años de experiencia, áreas de experiencia y LinkedIn son obligatorios.",
  cv_invalido: "La hoja de vida debe ser un PDF de máximo 5 MB.",
};

function boolToValue(value: boolean | null | undefined): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; guardado?: string };
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.EMPLEABLE) {
    redirect("/");
  }

  const profile = await prisma.talentProfile.findUnique({
    where: { ownerId: session.user.id },
  });

  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Mi perfil</h1>
      <p className="mt-2 text-base text-gray-600">
        Esta información se ve en el directorio de talento — entre más completo, más fácil que te
        encuentren.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-lg bg-error-soft px-3.5 py-2.5 text-sm text-error">
          {errorMessage}
        </p>
      )}
      {searchParams.guardado && (
        <p className="mt-4 rounded-lg bg-success-soft px-3.5 py-2.5 text-sm text-success">
          Guardado.
        </p>
      )}

      <form action={saveMyProfile} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="headline">Profesión / rol</label>
          <input id="headline" name="headline" required defaultValue={profile?.headline} className="field mt-1 w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="school">Escuela de formación</label>
            <select id="school" name="school" required defaultValue={profile?.school ?? ""} className="field mt-1 w-full">
              <option value="" disabled>
                Selecciona una escuela
              </option>
              {TALENT_SCHOOLS.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="experienceYears">Años de experiencia</label>
            <input
              id="experienceYears"
              name="experienceYears"
              type="number"
              min={0}
              max={60}
              required
              defaultValue={profile?.experienceYears ?? ""}
              className="field mt-1 w-full"
            />
          </div>
        </div>
        <div>
          <label htmlFor="postgraduates">Posgrados (opcional)</label>
          <input id="postgraduates" name="postgraduates" defaultValue={profile?.postgraduates ?? ""} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="experienceAreas">Áreas de experiencia</label>
          <textarea id="experienceAreas" name="experienceAreas" required rows={3} defaultValue={profile?.experienceAreas} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="motivations">Qué estás buscando (opcional)</label>
          <textarea id="motivations" name="motivations" rows={2} defaultValue={profile?.motivations ?? ""} className="field mt-1 w-full" />
        </div>

        <fieldset className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
          <legend className="px-1 text-sm font-medium text-ink">Estado laboral</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="isEmployed">¿Estás empleado actualmente?</label>
              <select id="isEmployed" name="isEmployed" defaultValue={boolToValue(profile?.isEmployed)} className="field mt-1 w-full">
                <option value="">Prefiero no decir</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="isSeekingWork">¿Estás buscando empleo o proyectos?</label>
              <select id="isSeekingWork" name="isSeekingWork" defaultValue={boolToValue(profile?.isSeekingWork)} className="field mt-1 w-full">
                <option value="">Prefiero no decir</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="employmentStatusVisible"
              defaultChecked={profile?.employmentStatusVisible ?? true}
            />
            Mostrar mi estado laboral a los demás (si lo desmarcas, solo tú y el admin lo ven)
          </label>
        </fieldset>

        <div>
          <label htmlFor="linkedinUrl">LinkedIn</label>
          <input id="linkedinUrl" name="linkedinUrl" required defaultValue={profile?.linkedinUrl} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="photoUrl">Foto (URL de imagen, opcional)</label>
          <input id="photoUrl" name="photoUrl" defaultValue={profile?.photoUrl ?? ""} className="field mt-1 w-full" />
        </div>
        <div>
          <label htmlFor="contactLink">Link de contacto directo (opcional)</label>
          <input id="contactLink" name="contactLink" defaultValue={profile?.contactLink ?? ""} className="field mt-1 w-full" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="contactLinkPublic"
            defaultChecked={profile?.contactLinkPublic ?? false}
          />
          Mostrar este link incluso a invitados no registrados
        </label>

        <fieldset className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
          <legend className="px-1 text-sm font-medium text-ink">Hoja de vida (PDF, opcional)</legend>
          {profile?.cvFileName ? (
            <p className="text-sm text-gray-600">
              Ya subiste{" "}
              <a href={`/talento/${profile.id}/cv`} className="font-medium text-primary hover:underline">
                {profile.cvFileName}
              </a>
              . Sube otro archivo abajo para reemplazarla.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Cualquiera que entre al directorio (empresas, instituciones e invitados) podrá
              descargarla desde tu perfil.
            </p>
          )}
          <input id="cv" name="cv" type="file" accept="application/pdf" className="field mt-1 w-full" />
          <p className="text-xs text-gray-500">Máximo 5 MB.</p>
        </fieldset>

        <button type="submit" className="btn-primary self-start">
          Guardar
        </button>
      </form>

      {profile?.cvFileName && (
        <form action={deleteMyCv} className="mt-3">
          <button type="submit" className="text-sm text-error hover:underline">
            Eliminar hoja de vida
          </button>
        </form>
      )}
    </main>
  );
}
