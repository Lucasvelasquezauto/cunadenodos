import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { GenerateAndCopy } from "@/components/GenerateAndCopy";
import { generatePasswordResetLink } from "@/app/admin/invitations/actions";
import { createUser, deleteUser } from "./actions";

export default async function UsersPage() {
  const [users, cohorts] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { cohort: true } }),
    prisma.cohort.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Usuarios</h1>

      <form
        action={createUser}
        className="mt-6 flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <h2 className="text-sm font-medium">Nuevo usuario</h2>
        <input
          name="email"
          type="text"
          required
          placeholder="Correo, o usuario simple para institución (ej. EAFIT)"
          className="field"
        />
        <input
          name="password"
          type="text"
          required
          minLength={8}
          placeholder="Contraseña inicial (mínimo 8 caracteres)"
          className="field"
        />
        <select name="role" required defaultValue="" className="field">
          <option value="" disabled>
            Rol...
          </option>
          <option value={Role.ADMIN}>Admin</option>
          <option value={Role.EMPRENDEDOR}>Emprendedor</option>
          <option value={Role.EMPLEABLE}>Empleable</option>
          <option value={Role.INSTITUCION}>Institución</option>
        </select>
        <select name="org" defaultValue="" className="field">
          <option value="">Organización (solo si es Institución)</option>
          <option value="EAFIT">EAFIT</option>
          <option value="ANDI">ANDI</option>
        </select>
        <select name="cohortId" required defaultValue="" className="field">
          <option value="" disabled>
            Cohorte...
          </option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn-primary self-start"
        >
          Crear usuario
        </button>
      </form>

      <ul className="mt-6 flex flex-col divide-y divide-gray-200">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-2 py-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-gray-500">
                  {user.role}
                  {user.org ? ` · ${user.org}` : ""} · {user.cohort.name}
                </p>
              </div>
              <form action={deleteUser.bind(null, user.id)}>
                <button type="submit" className="text-error hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
            <GenerateAndCopy
              label="Generar link para restablecer contraseña"
              action={generatePasswordResetLink.bind(null, user.id)}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
