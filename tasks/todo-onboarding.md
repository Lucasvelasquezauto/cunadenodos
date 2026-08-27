# Tasks: onboarding

Fase 3, sobre `tasks/plan-onboarding.md` aprobado. Orden = orden de ejecución.

- [x] **T1 — Esquema Prisma: consentimiento en `User`**
  - Acceptance: `consentDataProcessingAt DateTime?` y `consentDirectoryAt DateTime?` agregados;
    migración aplicada.
  - Verify: `npx prisma migrate dev` corre limpio; `npx prisma studio` muestra los campos.
  - Files: `prisma/schema.prisma`

- [x] **T2 — Backfill de consentimiento en `prisma/seed.ts`**
  - Acceptance: todas las cuentas ficticias (`create` **y** `update`) quedan con ambos timestamps
    poblados — aprendiendo del bug ya documentado de `update: {}` que dejaba nombres desactualizados.
  - Verify: re-correr el seed sobre datos existentes y confirmar en DB que los timestamps quedan
    poblados incluso en cuentas que ya existían.
  - Files: `prisma/seed.ts`

- [x] **T3 — Checkboxes de consentimiento en `/invite/[token]`**
  - Acceptance: dos checkboxes `required` con el texto ya redactado en `SPEC-onboarding.md` (a) y
    (b).
  - Verify: manual — el formulario no se puede enviar sin marcarlos (validación de navegador) y el
    server-side los vuelve a exigir.
  - Files: `app/invite/[token]/page.tsx`

- [x] **T4 — `joinWithInvitation` exige y guarda el consentimiento**
  - Acceptance: sin ambos checkboxes marcados, redirige con `error=missing_consent`; con ambos, la
    cuenta nueva se crea con `consentDataProcessingAt`/`consentDirectoryAt` en `new Date()`.
  - Verify: manual — intentar enviar sin marcar (server action, no solo HTML) falla; con ambos,
    cuenta creada con los timestamps.
  - Files: `app/invite/[token]/actions.ts`, `app/invite/[token]/page.tsx` (mensaje de error)

- [x] **T5 — `components/ProfileReminderBanner.tsx`**
  - Acceptance: no renderiza nada para institución/admin; para emprendedor sin empresa completa o
    empleable sin perfil completo, muestra el banner con link a `/empresas/mia` o `/perfil`.
  - Verify: manual con cada combinación de rol/completitud.
  - Files: `components/ProfileReminderBanner.tsx`

- [x] **T6 — Cablear el banner**
  - Acceptance: visible en `app/(app)/layout.tsx` y en la rama de sesión activa de `app/page.tsx`;
    ausente en `/metricas` y `/admin` (no se tocan, ver Plan).
  - Verify: manual — navegar como emprendedor/empleable con perfil incompleto por Empresas,
    Talento, Mensajes y la portada; confirmar que aparece en todas.
  - Files: `app/(app)/layout.tsx`, `app/page.tsx`

- [x] **T7 — Tests e2e**
  - Acceptance: `/invite/[token]` rechaza sin ambos consentimientos; con ambos, crea la cuenta con
    los timestamps poblados; el banner aparece para una cuenta nueva con perfil vacío y desaparece
    tras completarlo.
  - Verify: `npm run test:e2e` en verde.
  - Files: `e2e/invite.spec.ts` (extendido) o `e2e/onboarding.spec.ts` (nuevo, a decidir según
    tamaño al implementar)

- [x] **T8 — Checklist final contra Success Criteria**
  - Acceptance: cada ítem de "Success Criteria" en `SPEC-onboarding.md` verificado.
  - Verify: recorrido manual + `npm run test` y `npm run test:e2e` en verde a la vez.
  - Files: `SPEC-onboarding.md`, `tasks/todo-onboarding.md`
