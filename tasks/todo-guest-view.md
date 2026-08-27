# Tasks: guest-view

Fase 3, sobre `tasks/plan-guest-view.md` aprobado. Orden = orden de ejecución.

- [x] **T1 — Corregir `canSeeEmploymentStatus` en `lib/talent.ts`**
  - Acceptance: el chequeo de `viewer` nulo va antes que el de `employmentStatusVisible` — un
    invitado (`viewer: null`) nunca ve el estado laboral, sin importar ese campo.
  - Verify: test unit nuevo: `canSeeEmploymentStatus({employmentStatusVisible: true, ownerId: "x"}, null)` es `false`.
  - Files: `lib/talent.ts`, `tests/talent.test.ts`

- [x] **T2 — `app/invitado/layout.tsx`**
  - Acceptance: verifica `getGuestModeEnabled()` una sola vez; si es falso, muestra "No disponible"
    sin renderizar `{children}`; si es verdadero, envuelve `{children}` en un header liviano (logo,
    Empresas, Talento, Ingresar).
  - Verify: manual, junto con T3-T5.
  - Files: `app/invitado/layout.tsx`

- [x] **T3 — `app/invitado/page.tsx`**
  - Acceptance: landing corta con links a Empresas y Talento.
  - Verify: manual.
  - Files: `app/invitado/page.tsx`

- [x] **T4 — `app/invitado/empresas/page.tsx` + `[id]/page.tsx`**
  - Acceptance: mismas queries que las versiones autenticadas; sin nav de cuenta ni acciones de
    escritura.
  - Verify: manual, comparando con `/empresas` autenticado.
  - Files: `app/invitado/empresas/page.tsx`, `app/invitado/empresas/[id]/page.tsx`

- [x] **T5 — `app/invitado/talento/page.tsx` + `[id]/page.tsx`**
  - Acceptance: el detalle pasa el registro por `serializeTalentProfile(record, null)` antes de
    renderizar — nunca accede a `isEmployed`/`isSeekingWork` directamente; sin botón "Contactar".
  - Verify: manual con un perfil `employmentStatusVisible: true` — el estado laboral no debe
    aparecer.
  - Files: `app/invitado/talento/page.tsx`, `app/invitado/talento/[id]/page.tsx`

- [x] **T6 — Actualizar el link "Ver como invitado" en `/`**
  - Acceptance: apunta a `/invitado` en vez de `/guest-check`.
  - Verify: manual.
  - Files: `app/page.tsx`

- [x] **T7 — Eliminar el stub `app/guest-check/page.tsx`**
  - Acceptance: la ruta ya no existe; nada más la referencia.
  - Verify: `npm run build` no falla por referencias rotas.
  - Files: `app/guest-check/page.tsx` (eliminado)

- [x] **T8 — Tests e2e**
  - Acceptance: `e2e/guest-mode.spec.ts` reescrito sobre `/invitado` (toggle on/off); casos nuevos
    para lista/detalle de empresas y talento visibles con modo activo, estado laboral ausente en
    un perfil `employmentStatusVisible: true`, y ausencia de "Contactar"/acciones de escritura.
  - Verify: `npm run test:e2e` en verde.
  - Files: `e2e/guest-mode.spec.ts`

- [x] **T9 — Checklist final contra Success Criteria**
  - Acceptance: cada ítem de "Success Criteria" en `SPEC-guest-view.md` verificado.
  - Verify: recorrido manual + `npm run test` y `npm run test:e2e` en verde a la vez.
  - Files: `SPEC-guest-view.md`, `tasks/todo-guest-view.md`
