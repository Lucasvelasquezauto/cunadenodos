# Tasks: admin-dashboard

Fase 3, sobre `tasks/plan-admin-dashboard.md` aprobado. Orden = orden de ejecución.

- [x] **T1 — `app/metricas/layout.tsx`**
  - Acceptance: sin sesión redirige a `/login`; con rol distinto de `ADMIN`/`INSTITUCION` redirige
    a `/`; con `ADMIN` o `INSTITUCION` renderiza `{children}` con un header simple.
  - Verify: manual con las tres combinaciones de rol.
  - Files: `app/metricas/layout.tsx`

- [x] **T2 — `app/metricas/page.tsx`**
  - Acceptance: sección de completitud con conteos correctos de `Company`/`TalentProfile`
    (usando `isCompanyComplete`/`isProfileComplete`); sección de conexiones listando todas las
    conversaciones (iniciador, receptor, estado, fecha) sin ningún `include`/`select` de `Message`.
  - Verify: manual, comparando conteos contra los datos de seed.
  - Files: `app/metricas/page.tsx`

- [x] **T3 — Link "Métricas" en `AppNav`**
  - Acceptance: visible solo para `ADMIN`/`INSTITUCION`, apunta a `/metricas`.
  - Verify: manual con cada rol.
  - Files: `components/AppNav.tsx`

- [x] **T4 — Tests e2e**
  - Acceptance: acceso permitido con admin e institución, denegado (redirect a `/`) con
    emprendedor/empleable; conteos de completitud correctos; el texto de un mensaje real del seed
    no aparece en `/metricas`.
  - Verify: `npm run test:e2e` en verde.
  - Files: `e2e/metricas.spec.ts`

- [x] **T5 — Checklist final contra Success Criteria**
  - Acceptance: cada ítem de "Success Criteria" en `SPEC-admin-dashboard.md` verificado.
  - Verify: recorrido manual + `npm run test` y `npm run test:e2e` en verde a la vez.
  - Files: `SPEC-admin-dashboard.md`, `tasks/todo-admin-dashboard.md`
