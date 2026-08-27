# Tasks: directory-companies + directory-talent

Fase 3, sobre `tasks/plan-directories.md` aprobado. Orden = orden de ejecución.

- [x] **T1 — Esquema Prisma: Company + TalentProfile**
  - Acceptance: modelos definidos con relaciones a `User`/`Cohort`, `onDelete: Cascade` en
    `ownerId`; migración aplicada.
  - Verify: `npx prisma migrate dev` corre limpio; `npx prisma studio` muestra las tablas.
  - Files: `prisma/schema.prisma`

- [x] **T2 — `components/Avatar.tsx`**
  - Acceptance: muestra imagen si hay URL, iniciales sobre color si no.
  - Verify: manual, cubierto también al renderizar listas en T7/T10.
  - Files: `components/Avatar.tsx`

- [x] **T3 — Helpers `lib/companies.ts` y `lib/talent.ts`**
  - Acceptance: `isCompanyComplete(company)` y `isProfileComplete(profile)` puros, sin acceso a
    DB, cubiertos por tests.
  - Verify: `npm run test` pasa con los nuevos casos.
  - Files: `lib/companies.ts`, `lib/talent.ts`, `tests/companies.test.ts`, `tests/talent.test.ts`

- [x] **T4 — Layout compartido `app/(app)/layout.tsx` + nav como componente**
  - Acceptance: `/empresas`, `/talento`, `/perfil`, `/empresas/mia` exigen sesión (redirige a
    `/login` si no hay) y muestran la nav. **`/` se queda fuera de este grupo** — sigue siendo
    pública; muestra la misma nav vía `AppNav` cuando hay sesión, sin redirigir cuando no la hay
    (la portada debe seguir alcanzable sin cuenta).
  - Verify: `npm run build` y `npm run test:e2e` (auth.spec.ts) siguen en verde.
  - Files: `app/(app)/layout.tsx`, `components/AppNav.tsx`, `app/page.tsx`

- [x] **T5 — Seed: empresas ficticias**
  - Acceptance: 6-8 usuarios `EMPRENDEDOR` adicionales + sus `Company`, contenido variado y
    creíble (sector, tono, longitud) — no texto de plantilla.
  - Verify: revisión manual del contenido antes de seguir (checkpoint B del plan).
  - Files: `prisma/seed.ts`

- [x] **T6 — Seed: perfiles de talento ficticios**
  - Acceptance: 8-10 usuarios `EMPLEABLE` adicionales + su `TalentProfile`, variedad de áreas de
    experiencia y al menos un par con `employmentStatusVisible: false`.
  - Verify: revisión manual del contenido.
  - Files: `prisma/seed.ts`

- [x] **T7 — `/empresas` (lista)**
  - Acceptance: muestra nombre, tagline y sector de todas las empresas; accesible con cualquier
    rol con sesión.
  - Verify: manual con distintas cuentas de prueba.
  - Files: `app/(app)/empresas/page.tsx`

- [x] **T8 — `/empresas/[id]` (detalle)**
  - Acceptance: muestra propósito, valores, fundadores (nombre + bio), propuesta de valor, y el
    link de contacto solo si `contactLinkPublic` es verdadero.
  - Verify: manual, comparando una empresa con y sin link de contacto público.
  - Files: `app/(app)/empresas/[id]/page.tsx`

- [x] **T9 — `/empresas/mia` (autoedición) + `actions.ts`**
  - Acceptance: emprendedor sin empresa ve formulario vacío; con empresa la ve precargada; el
    server action verifica que el `ownerId` coincida con la sesión antes de escribir.
  - Verify: manual — crear, editar, e intentar forzar la edición de la empresa de otro (falla).
  - Files: `app/(app)/empresas/mia/page.tsx`, `app/(app)/empresas/mia/actions.ts`

- [x] **T10 — `/talento` (lista)**
  - Acceptance: muestra nombre, profesión y áreas de experiencia de todos los perfiles;
    accesible con cualquier rol con sesión.
  - Verify: manual.
  - Files: `app/(app)/talento/page.tsx`

- [x] **T11 — `/talento/[id]` (detalle)**
  - Acceptance: muestra el perfil completo; `isEmployed`/`isSeekingWork` solo se incluyen en los
    datos servidos si `employmentStatusVisible` es verdadero o quien mira es el dueño o admin —
    no solo ocultos en el render.
  - Verify: manual con un perfil visible y uno oculto, desde una cuenta ajena.
  - Files: `app/(app)/talento/[id]/page.tsx`

- [x] **T12 — `/perfil` (autoedición) + `actions.ts`**
  - Acceptance: mismo patrón que T9 pero para `TalentProfile`; LinkedIn requerido al guardar.
  - Verify: manual — crear, editar, intentar editar el de otro (falla), guardar sin LinkedIn
    (rechazado).
  - Files: `app/(app)/perfil/page.tsx`, `app/(app)/perfil/actions.ts`

- [x] **T13 — Tests unit**
  - Acceptance: cobertura de `isCompanyComplete`, `isProfileComplete`, y la lógica de qué campos
    de estado laboral se sirven según `employmentStatusVisible` + rol de quien mira.
  - Verify: `npm run test` en verde.
  - Files: `tests/companies.test.ts`, `tests/talent.test.ts`

- [x] **T14 — Tests e2e**
  - Acceptance: listas accesibles con sesión; detalle de talento oculta/muestra estado laboral
    correctamente; autoedición crea y actualiza; un usuario no puede editar el recurso de otro.
  - Verify: `npm run test:e2e` en verde.
  - Files: `e2e/directories.spec.ts`

- [x] **T15 — Checklist final contra Success Criteria**
  - Acceptance: cada ítem de "Success Criteria" en ambos `SPEC-directory-*.md` verificado.
  - Verify: recorrido manual + `npm run test` y `npm run test:e2e` en verde a la vez.
  - Files: `SPEC-directory-companies.md`, `SPEC-directory-talent.md`, `tasks/todo-directories.md`
