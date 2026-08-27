# Tasks: Autenticación por contraseña

Ver `SPEC-auth-password.md` y `tasks/plan-auth-password.md`.

- [ ] Task: Schema — `passwordHash` en `User`, nuevo modelo `PasswordResetToken`, elimina `LastLinkCache`
  - Acceptance: migración aplicada limpia, `prisma generate` sin errores.
  - Verify: `npx prisma migrate dev --name password_auth` corre sin conflictos.
  - Files: `prisma/schema.prisma`, nueva migración en `prisma/migrations/`.

- [ ] Task: `lib/passwords.ts` — hash/verify + ciclo de vida del token de reset
  - Acceptance: `hashPassword`/`verifyPassword` funcionan; `evaluateResetToken`
    cubre válido/vencido/no-encontrado/ya-usado como función pura testable.
  - Verify: `lib/passwords.test.ts` en verde.
  - Files: `lib/passwords.ts`, `lib/passwords.test.ts`, `package.json` (agrega `bcryptjs` + tipos).

- [ ] Task: `lib/auth.ts` — provider Credentials + sesión JWT
  - Acceptance: login válido crea sesión con `role`/`org`/`cohortId` en el
    token; login inválido devuelve error manejable desde `/login`; se eliminan
    `getLastGeneratedLink` y el callback `signIn` viejo.
  - Verify: `npm run build` sin errores de tipos.
  - Files: `lib/auth.ts`, `types/next-auth.d.ts`.

- [ ] Task: Limpieza de infraestructura de magic link
  - Acceptance: no quedan referencias a Resend, `E2E_TEST_SECRET`,
    `LastLinkCache` en el código.
  - Verify: `grep -ri "resend\|last-link\|E2E_TEST_SECRET" app lib` sin resultados
    (fuera de este archivo de tareas).
  - Files: borra `app/api/test/last-link/route.ts`; edita `package.json`
    (quita dependencia `resend` si no se usa en otro lado).

- [ ] Task: `/login` — formulario correo/usuario + contraseña
  - Acceptance: login exitoso redirige a `/`; credenciales inválidas muestran
    mensaje de error; el campo usuario acepta texto plano tipo "EAFIT".
  - Verify: prueba manual con un usuario sembrado.
  - Files: `app/(auth)/login/page.tsx`; borra `app/(auth)/verify-request/page.tsx`.

- [ ] Task: `/invite/[token]` — contraseña en el registro
  - Acceptance: el registro exige contraseña + confirmación (mínimo 8
    caracteres), las guarda hasheadas junto con los consentimientos ya
    existentes.
  - Verify: `e2e/invite.spec.ts` actualizado y en verde.
  - Files: `app/invite/[token]/page.tsx`, `app/invite/[token]/actions.ts`.

- [ ] Task: `/admin/users` — creación con contraseña + link de reset
  - Acceptance: "Nuevo usuario" crea la cuenta con la contraseña dada; el
    botón por usuario genera un link de `/reset-password/<token>` copiable.
  - Verify: prueba manual — crear cuenta institución (`EAFIT` / contraseña),
    loguearse con ella.
  - Files: `app/admin/users/page.tsx`, `app/admin/users/actions.ts`,
    `app/admin/invitations/actions.ts` (reemplaza `generateAccessLink`).

- [ ] Task: `/reset-password/[token]` — nueva ruta
  - Acceptance: token vencido/inválido/ya usado muestra mensaje claro; token
    válido deja fijar contraseña nueva, la invalida al usarse, redirige a
    `/login`.
  - Verify: prueba manual del ciclo completo (generar desde admin → usar →
    loguearse con la nueva contraseña → reusar el mismo link falla).
  - Files: `app/reset-password/[token]/page.tsx`, `app/reset-password/[token]/actions.ts`.

- [ ] Task: `e2e/helpers.ts` y specs — login directo por contraseña
  - Acceptance: `loginAs` ya no depende de ningún link; todos los specs
    existentes actualizados a la nueva firma y en verde.
  - Verify: `npx playwright test` completo en verde.
  - Files: `e2e/helpers.ts`, todos los `e2e/*.spec.ts` que llaman `loginAs`.

- [ ] Task: `prisma/seed.ts` — contraseñas para usuarios sembrados
  - Acceptance: cada usuario del seed tiene `passwordHash` válido con una
    contraseña de prueba documentada en el propio archivo.
  - Verify: `npx prisma db seed` corre limpio, e2e pasa contra esos usuarios.
  - Files: `prisma/seed.ts`.

- [ ] Task: Verificación final end-to-end
  - Acceptance: `npm run lint`, `npm run build`, unit tests y e2e completos en
    verde; QA manual de los 4 flujos (invitación+contraseña, login
    institución, login normal, reset de contraseña) en el navegador.
  - Verify: los cuatro comandos + checklist manual, uno por uno.
  - Files: ninguno (verificación).
