# Spec: directory-talent

Módulo del Capability Map (ver `CAPABILITY-MAP.md`). Depende de `identity`. No depende de
`directory-companies` — mismo paso del build order, en paralelo.

## Objective

Directorio de los 70 empleables: profesión, posgrados, áreas de experiencia, motivaciones, link
de LinkedIn, y estado laboral con visibilidad controlada por cada persona. Misma lógica de
autoedición que `directory-companies`, alimentado con datos ficticios para el demo.

**Quién lo usa:**
- **Empleable**: crea/edita **su propio** perfil; navega el directorio completo de los demás
  (incluidos otros empleables — decisión ya tomada de visibilidad mutua y completa).
- **Emprendedor, Institución, Admin**: navegan el directorio completo.
- **Invitado / `guest-view` (futuro)**: verá una versión resumida más adelante, sin el estado
  laboral ni contacto directo salvo que la persona lo haya hecho público.

**Éxito para este módulo:** el directorio muestra perfiles ficticios con variedad real; cualquier
cuenta lo navega; un empleable controla si su estado laboral es visible a los demás; el esquema
queda listo para que `onboarding` lo pueble con datos reales sin migraciones adicionales.

## Tech Stack, Commands, Code Style, Testing Strategy

Iguales a `SPEC-identity.md`. No se repiten aquí.

## Project Structure (nuevo)

```
prisma/schema.prisma      → + modelo TalentProfile
prisma/seed.ts            → + 8-10 perfiles ficticios variados
lib/talent.ts             → isProfileComplete(profile), queries reusables
app/talento/page.tsx      → lista (nombre, profesión, áreas de experiencia)
app/talento/[id]/page.tsx → detalle completo
app/perfil/page.tsx       → autoedición de "mi perfil" (crea si no existe)
app/perfil/actions.ts     → upsert del perfil propio
```

(`components/Avatar.tsx` ya se crea en `directory-companies`, se reusa aquí.)

## Modelo de datos

```prisma
model TalentProfile {
  id                      String   @id @default(cuid())
  ownerId                 String   @unique
  owner                   User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  cohortId                String
  cohort                  Cohort   @relation(fields: [cohortId], references: [id])

  headline                String   // profesión base — resumen para la lista
  postgraduates           String?  // posgrados
  experienceAreas         String   // temas/áreas de experiencia laboral
  motivations             String?  // qué está buscando / principios

  isEmployed              Boolean?
  isSeekingWork           Boolean?
  employmentStatusVisible Boolean  @default(true) // si es false, solo la persona y admin lo ven

  linkedinUrl             String   // requerido
  contactLink             String?  // opcional, adicional al LinkedIn
  contactLinkPublic       Boolean  @default(false)
  photoUrl                String?

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

`employmentStatusVisible`: cuando es `false`, la página de detalle oculta `isEmployed` /
`isSeekingWork` para cualquiera que no sea el dueño del perfil o admin — mismo criterio para
todos los que miran, sin distinción por rol (así de simple lo pidió el usuario en la conversación
de arquitectura).

## Boundaries

- **Always:** un empleable solo edita su propio perfil (verificado en el server action); LinkedIn
  requerido al guardar (es el único dato de contacto obligatorio del brief original); datos de
  seed claramente ficticios.
- **Ask first:** cambios al esquema; subida real de foto (fuera de alcance v1).
- **Never:** exponer `isEmployed`/`isSeekingWork` cuando `employmentStatusVisible` es `false`,
  ni siquiera en la respuesta de la API/props del server component a un visitante que no sea el
  dueño o admin — no basta con ocultarlo solo visualmente en el cliente.

## Success Criteria

- [x] `TalentProfile` en el esquema, migración aplicada.
- [x] Seed crea 8-10 perfiles ficticios variados (con y sin `employmentStatusVisible`, distintas
      áreas de experiencia), ligados a usuarios `EMPLEABLE` ficticios adicionales — 9 en total, 2
      con `employmentStatusVisible: false`.
- [x] `/talento` lista todos los perfiles (nombre, profesión, áreas), accesible para cualquier rol
      con sesión — verificado en navegador y e2e.
- [x] `/talento/[id]` muestra el detalle completo; si `employmentStatusVisible` es `false` y quien
      mira no es el dueño ni admin, esos dos campos no aparecen (verificado también a nivel de
      datos servidos, no solo ocultos en el HTML) — verificado con `empleable@demo.board` (no ve)
      y `admin@demo.board` (sí ve) sobre el mismo perfil, en navegador y e2e.
- [x] Un empleable sin perfil todavía, al entrar a `/perfil`, ve un formulario vacío; uno que ya
      tiene perfil lo ve precargado y editable — verificado en navegador.
- [x] Un empleable no puede editar el perfil de otro — mismo patrón que `directory-companies`
      (sin ruta `[id]`, `ownerId` siempre de la sesión).
- [x] `isProfileComplete()` disponible en `lib/talent.ts`, cubierto por test unit.
- [x] `npm run test` y `npm run test:e2e` pasan en verde (22 unit, 13 e2e junto con
      `directory-companies`).

## Open Questions (resueltas)

1. Confirmado por el usuario: sin subida real de foto, sin panel admin dedicado
   para editar el perfil de otro (solo borrar la cuenta, que borra el perfil en cascada). ¿De
   acuerdo para v1?
