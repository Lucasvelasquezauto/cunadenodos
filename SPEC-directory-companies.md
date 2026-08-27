# Spec: directory-companies

Módulo del Capability Map (ver `CAPABILITY-MAP.md`). Depende de `identity` (ya construido y
verificado). No depende de `directory-talent` — se construyen en paralelo, mismo paso del build
order.

## Objective

Directorio de las empresas de la ruta de emprendimiento: una vista resumida (para descubrir) y
una de detalle (para conocer a fondo), más una pantalla de autoedición para que cada emprendedor
mantenga los datos de su propia empresa al día. Alimentado con datos ficticios para el demo de
EAFIT; el módulo `onboarding` (al final del build order) reusará la misma pantalla de edición,
añadiéndole el flujo de consentimiento y la distribución masiva.

**Quién lo usa:**
- **Emprendedor**: crea/edita los datos de **su propia** empresa (relación 1:1 con su cuenta);
  navega el directorio completo de las demás.
- **Empleable, Institución, Admin**: navegan el directorio completo (lista y detalle) — decisión
  ya tomada de que los directorios son visibles y mutuos entre todos los roles con cuenta, sin
  restricción cruzada.
- **Invitado / módulo `guest-view` (futuro)**: consumirá este mismo directorio en versión
  resumida — este módulo debe dejar los datos y el helper de "perfil completo" listos para que
  `guest-view` y `messaging` los usen después, aunque esos módulos no se construyen todavía.

**Éxito para este módulo:** el directorio muestra empresas reales (ficticias) con variedad;
cualquier cuenta puede navegar lista y detalle; un emprendedor puede crear/editar su propia
empresa; los datos quedan en un esquema que `onboarding` podrá poblar más adelante sin
migraciones adicionales.

## Tech Stack, Commands, Code Style, Testing Strategy

Iguales a `SPEC-identity.md` (Next.js 14 App Router + TypeScript + Prisma + Tailwind con el
sistema de diseño de `DESIGN.md`; Vitest para lógica pura; Playwright para el camino crítico).
No se repiten aquí.

## Project Structure (nuevo)

```
prisma/schema.prisma     → + modelo Company
prisma/seed.ts           → + 6-8 empresas ficticias con variedad real (sector, tamaño de texto)
components/Avatar.tsx    → iniciales sobre color si no hay logoUrl/photoUrl (compartido con
                            directory-talent)
lib/companies.ts         → isCompanyComplete(company), queries reusables
app/empresas/page.tsx    → lista (nombre, tagline, sector)
app/empresas/[id]/page.tsx → detalle completo
app/empresas/mia/page.tsx  → autoedición de "mi empresa" (crea si no existe)
app/empresas/mia/actions.ts → upsert de la empresa propia
```

## Modelo de datos

```prisma
model Company {
  id                String   @id @default(cuid())
  ownerId           String   @unique
  owner             User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  cohortId          String
  cohort            Cohort   @relation(fields: [cohortId], references: [id])

  name              String
  tagline           String   // resumen corto, para la lista — "qué hace" en una línea
  sector            String?
  logoUrl           String?
  description       String   // qué hace, a fondo
  purpose           String?  // propósito
  values            String?  // principios/valores
  valueProp         String   // propuesta de valor
  founders          Json     // [{ name: string, bio: string }] — texto libre, no ligado a cuentas
  website           String?
  contactLink       String?  // opcional — WhatsApp, otro canal directo
  contactLinkPublic Boolean  @default(false) // opt-in explícito, visible incluso a invitados

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

`onDelete: Cascade` en `ownerId`: si admin elimina la cuenta del emprendedor, su empresa se borra
con ella — mismo patrón que ya existe para `Session` en `identity`.

## Boundaries

- **Always:** cada emprendedor solo puede editar la empresa cuyo `ownerId` sea su propio id
  (verificado en el server action, no solo ocultando el botón en la UI); datos de seed claramente
  ficticios.
- **Ask first:** cambios al esquema después de aprobado; agregar subida real de archivos (fuera
  de alcance v1 — ver Open Questions).
- **Never:** un botón de "Contactar" funcional en esta fase — el módulo `messaging` todavía no
  existe; mostrar un botón que no hace nada sería confuso en el demo. Se agrega cuando se
  construya `messaging`.

## Success Criteria

- [x] `Company` en el esquema, con migración aplicada.
- [x] Seed crea 6-8 empresas ficticias variadas (sector, tamaño de texto, con y sin
      `contactLinkPublic`), ligadas a usuarios `EMPRENDEDOR` ficticios adicionales — 7 en total.
- [x] `/empresas` lista todas las empresas (nombre, tagline, sector), accesible para cualquier rol
      con sesión — verificado en navegador y e2e.
- [x] `/empresas/[id]` muestra el detalle completo (propósito, valores, fundadores con bio,
      propuesta de valor, link de contacto si es público) — verificado en navegador.
- [x] Un emprendedor sin empresa todavía, al entrar a `/empresas/mia`, ve un formulario vacío para
      crear la suya; uno que ya tiene empresa ve sus datos precargados y puede editarlos —
      verificado en navegador y e2e.
- [x] Un emprendedor no puede editar la empresa de otro (ni por UI ni forzando la URL/acción) —
      no existe ruta con `[id]` para esta pantalla; el `ownerId` siempre sale de la sesión, nunca
      del formulario. Verificado en e2e.
- [x] `isCompanyComplete()` disponible en `lib/companies.ts`, cubierto por test unit.
- [x] `npm run test` y `npm run test:e2e` pasan en verde (22 unit, 13 e2e junto con `directory-talent`).

## Open Questions (resueltas)

1. Confirmado por el usuario: sin subida real de logo (URL de imagen o iniciales), sin
   panel admin dedicado para editar cualquier empresa (el admin puede borrar la cuenta del
   emprendedor si hace falta, que borra la empresa en cascada, pero no hay UI para editar el
   contenido de una empresa ajena). ¿Lo dejamos así para v1?
