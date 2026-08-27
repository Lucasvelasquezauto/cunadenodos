# Plan: onboarding

Fase 2 (Plan) sobre `SPEC-onboarding.md` ya aprobado (2 categorías de consentimiento, texto
genérico apoyado en Ley 1581/2012 y Decreto 1377/2013 pendiente de validación jurídica de EAFIT,
cuentas de seed tratadas como ya consentidas, banner siempre visible sin botón de cerrar).

## Dónde vive el banner — alcance exacto

El banner solo aplica a `EMPRENDEDOR`/`EMPLEABLE` con perfil/empresa incompleto — institución y
admin nunca lo necesitan (no tienen perfil que completar), y son justo los únicos roles que
llegan a `/metricas` o `/admin`. Así que **no hace falta tocar `app/metricas/layout.tsx` ni
`app/admin/layout.tsx`** — el banner se agrega en dos lugares nada más:

- `app/(app)/layout.tsx` (Empresas, Talento, Mensajes, Mi empresa, Mi perfil).
- `app/page.tsx` (la portada, que ya muestra contenido distinto para quien tiene sesión).

## Componentes y orden de construcción

1. **Esquema Prisma**: `consentDataProcessingAt DateTime?` y `consentDirectoryAt DateTime?` en
   `User`. Migración.
2. **Backfill de las cuentas de seed**: `prisma/seed.ts` — poner ambos timestamps (`new Date()`)
   en el `create` de cada usuario ficticio, para que se comporten como si ya hubieran consentido
   (Asunción/decisión ya confirmada, cuentas de demo no necesitan pasar por el flujo real).
3. **`app/invite/[token]/page.tsx`**: agregar los dos checkboxes de consentimiento al formulario,
   con el texto ya redactado en `SPEC-onboarding.md`, cada uno `required`.
4. **`app/invite/[token]/actions.ts`**: `joinWithInvitation` valida que ambos checkboxes vengan
   marcados (mismo patrón que ya usa para `missing_email`/`missing_track` — nuevo
   `error=missing_consent`); al crear el `User`, guarda `consentDataProcessingAt`/
   `consentDirectoryAt` con `new Date()`.
5. **`components/ProfileReminderBanner.tsx`**: Server Component `{ role, userId }` — si el rol no
   es `EMPRENDEDOR`/`EMPLEABLE`, no renderiza nada; si es `EMPRENDEDOR`, consulta `Company` del
   usuario y aplica `isCompanyComplete`; si es `EMPLEABLE`, consulta `TalentProfile` y aplica
   `isProfileComplete`; si no existe el registro o está incompleto, renderiza el banner con link a
   `/empresas/mia` o `/perfil` según corresponda.
6. **Cablear el banner** en `app/(app)/layout.tsx` y `app/page.tsx` (rama de sesión activa).
7. **Tests**: unit — ninguna lógica nueva pura que valga la pena aislar más allá de lo que ya
   cubren `isCompanyComplete`/`isProfileComplete` existentes (el banner solo los reusa). e2e —
   `/invite/[token]` rechaza sin ambos checkboxes; con ambos marcados crea la cuenta con los
   timestamps poblados; el banner aparece para una cuenta emprendedor/empleable recién creada
   (perfil vacío) y desaparece después de completarlo (reusa el flujo de
   `directories.spec.ts`/`invite.spec.ts` como base).

**Secuencial:** (1) → (2) → (3)/(4) en paralelo con (5) → (6) → (7).

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Backfill del seed no se aplica porque `prisma.user.upsert` usa `update: {}` para usuarios ya existentes (mismo patrón que causó el bug de nombres "(Demo)" documentado en `directory-companies`) | Medio — las cuentas de demo no se verían "consentidas" al re-correr el seed sobre una DB que ya las tiene | Poner los timestamps también en el objeto `update`, no solo en `create` — aprender del bug ya documentado en vez de repetirlo |
| El banner cuenta como "muro de onboarding" si se hace mal (ej. bloqueando navegación) | Alto — contradice la decisión explícita ya tomada ("sin muro de onboarding") | El banner es puramente informativo — nunca redirige, nunca bloquea un link; solo la acción de "Contactar" sigue bloqueada, y eso ya está construido en `messaging`, no se toca aquí |
| Mostrar el texto de consentimiento como si estuviera validado legalmente, sin dejar rastro de que falta revisión | Medio (reputacional/legal, no técnico) | La nota de "pendiente de validación jurídica de EAFIT" queda documentada en `SPEC-onboarding.md`, no en la pantalla — se le recuerda al usuario en la respuesta de este chat, no se inventa un aviso en la UI que no se pidió |

## Checkpoints de verificación

- **A — Esquema y backfill:** migración aplicada; las cuentas de seed ya sembradas tienen ambos
  timestamps poblados tras re-correr el seed.
- **B — Registro exige consentimiento:** `/invite/[token]` no crea cuenta si falta cualquiera de
  los dos checkboxes; con ambos, la cuenta nueva queda con los timestamps.
- **C — Banner correcto:** visible para una cuenta emprendedor/empleable con perfil vacío, en `/`
  y en cualquier página de `(app)`; desaparece al completar el perfil; ausente para institución y
  admin en cualquier página que visiten.
- **D — Cierre:** checklist de `SPEC-onboarding.md` en verde + `npm run test` y `npm run test:e2e`
  pasan.

## Estimación de tiempo

~1 día — superficie chica (dos campos nuevos, un componente, un formulario existente que se
extiende), pero el backfill del seed y el cableado del banner en dos layouts distintos hay que
probarlos con cuidado para no repetir el bug de `update: {}` ya documentado en el proyecto.
