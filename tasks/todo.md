# Tasks: identity

Fase 3 del módulo `identity`, sobre `tasks/plan.md` aprobado. Orden = orden de ejecución.

- [x] **T1 — Scaffolding del proyecto**
  - Acceptance: `npm run dev` levanta la app sin errores; TypeScript en modo strict; Tailwind
    aplicando estilos.
  - Verify: `npm run build` termina en 0; `npm run dev` sirve una página sin errores de consola.
  - Files: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`,
    `app/layout.tsx` (generados por el scaffolding)

- [x] **T2 — Tooling de testing**
  - Acceptance: Vitest corre un test unit trivial; Playwright corre un test e2e trivial.
  - Verify: `npm run test` y `npm run test:e2e` pasan en verde.
  - Files: `vitest.config.ts`, `playwright.config.ts`, `tests/smoke.test.ts`, `e2e/smoke.spec.ts`

- [x] **T3 — Esquema Prisma + migración inicial**
  - Acceptance: modelos `User`, `Cohort`, `AppSettings`, `InvitationLink`, enum `Role`, y tablas
    de Auth.js (`Account`, `Session`, `VerificationToken`) definidos; migración aplicada contra el
    proyecto Supabase de desarrollo.
  - Verify: `npx prisma migrate dev` corre limpio; `npx prisma studio` muestra las tablas.
  - Files: `prisma/schema.prisma`, `.env` (local, no commiteado), `lib/db.ts`

- [x] **T4 — Script de seed**
  - Acceptance: `npx prisma db seed` crea 1 cohorte activa + 5 usuarios ficticios (admin,
    emprendedor, empleable, institución/EAFIT, institución/ANDI) con datos claramente falsos.
  - Verify: correr el seed y confirmar en Prisma Studio los 6 registros esperados.
  - Files: `prisma/seed.ts`, `package.json` (script de seed)

- [x] **T5 — Auth.js v5 + adapter Prisma + provider Email**
  - Acceptance: `/login` envía (o en dev, imprime en consola) un magic link solo si el correo ya
    existe como `User`; correo inexistente es rechazado con mensaje claro; la sesión queda en DB.
  - Verify: probar con un correo seed (funciona) y uno inventado (rechazado); confirmar fila nueva
    en tabla `Session` tras login exitoso.
  - Files: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/(auth)/login/page.tsx`,
    `app/(auth)/verify-request/page.tsx`

- [x] **T6 — Helpers de permisos + tests unit**
  - Acceptance: `hasRole(user, role)` y `canAccessRoute(user, path)` implementados y cubiertos por
    tests para cada rol.
  - Verify: `npm run test` pasa, incluyendo los nuevos casos.
  - Files: `lib/permissions.ts`, `tests/permissions.test.ts`

- [x] **T7 — Middleware de protección de rutas + modo invitado**
  - Acceptance: rutas `/admin/*` rechazan a quien no es admin; rutas guest respetan
    `AppSettings.guestModeEnabled`.
  - Verify: prueba manual con usuario `emprendedor` contra `/admin` (bloqueado); toggle ON/OFF
    cambia el acceso a `/guest-check`.
  - Files: `middleware.ts`, `lib/settings.ts`

- [x] **T8 — Página stub `/guest-check`**
  - Acceptance: página mínima alcanzable solo según el estado del modo invitado, para validar T7
    antes de que exista el módulo `guest-view` real.
  - Verify: manual; se cubre también en el e2e de T15.
  - Files: `app/guest-check/page.tsx`

- [x] **T9 — Modelo y lógica de `InvitationLink`**
  - Acceptance: función/endpoint para generar un `InvitationLink` (token, cohortId, expiresAt);
    validación reusable (token válido / expirado / inexistente).
  - Verify: tests unit de la validación en los tres casos.
  - Files: `lib/invitations.ts`, `tests/invitations.test.ts`

- [x] **T10 — Página `/invite/[token]`**
  - Acceptance: formulario pide correo + ruta (emprendimiento/empleabilidad); token válido crea (o
    reutiliza) el `User` y deja la sesión iniciada; token inválido/expirado muestra mensaje claro
    sin crear nada.
  - Verify: manual — token válido + correo nuevo crea cuenta y sesión; token vencido rechaza.
  - Files: `app/invite/[token]/page.tsx`, `app/invite/[token]/actions.ts`

- [x] **T11 — Panel admin: usuarios y cohortes**
  - Acceptance: admin puede crear cohorte; crear usuario (rol + cohorte + `org` si aplica);
    desactivar/eliminar usuario existente.
  - Verify: manual, contra el checklist de `SPEC-identity.md` (crear/eliminar desde la UI, no solo
    DB).
  - Files: `app/admin/users/page.tsx`, `app/admin/users/actions.ts`,
    `app/admin/cohorts/page.tsx`, `app/admin/cohorts/actions.ts`

- [x] **T12 — Panel admin: invitación y magic link manual**
  - Acceptance: botón "Generar link de invitación" muestra URL copiable; en la vista de un usuario
    existe botón para copiar su magic link vigente.
  - Verify: manual, contra el checklist del spec.
  - Files: `app/admin/invitations/page.tsx`, `lib/invitations.ts` (reuso), `lib/auth.ts` (helper)

- [x] **T13 — Panel admin: switch de modo invitado**
  - Acceptance: toggle que lee/escribe `AppSettings.guestModeEnabled` y se refleja de inmediato en
    el middleware (T7).
  - Verify: manual — prender/apagar y confirmar cambio de acceso en `/guest-check`.
  - Files: `app/admin/settings/page.tsx`, `app/admin/settings/actions.ts`

- [x] **T14 — Copys en español**
  - Acceptance: textos de `/login`, `/verify-request` y mensajes de error de invitación en
    español, tono profesional y amable (coherente con el punto 7 del brief original).
  - Verify: revisión manual de las tres pantallas.
  - Files: `app/(auth)/login/page.tsx`, `app/(auth)/verify-request/page.tsx`,
    `app/invite/[token]/page.tsx`

- [x] **T15 — Tests e2e de los 3 flujos del spec**
  - Acceptance: Playwright cubre (a) login exitoso + rechazo de ruta admin sin permiso, (b) toggle
    de modo invitado sobre `/guest-check`, (c) creación de cuenta vía invitación válida y rechazo
    con token vencido.
  - Verify: `npm run test:e2e` pasa en verde.
  - Files: `e2e/auth.spec.ts`, `e2e/guest-mode.spec.ts`, `e2e/invite.spec.ts`

- [x] **T16 — Checklist final contra Success Criteria**
  - Acceptance: cada ítem de "Success Criteria" en `SPEC-identity.md` verificado manualmente.
  - Verify: recorrido manual completo + `npm run test` y `npm run test:e2e` en verde a la vez.
  - Files: `SPEC-identity.md` (marcar checklist), `tasks/todo.md` (marcar tareas completas)
