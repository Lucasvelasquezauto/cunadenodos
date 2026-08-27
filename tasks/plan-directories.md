# Plan: directory-companies + directory-talent

Fase 2 (Plan) de ambos módulos, sobre `SPEC-directory-companies.md` y `SPEC-directory-talent.md`
ya aprobados. Se construyen juntos porque son paralelos en el build order y comparten patrones.

## Pieza compartida no listada en ninguno de los dos specs

Ninguna página autenticada de uso general (fuera de `/admin`) tiene hoy una barra de navegación
— solo el panel admin la tiene. Sin esto, `/empresas`, `/talento`, `/perfil`, `/empresas/mia`
quedarían inalcanzables para un usuario normal salvo que escriba la URL a mano. Se agrega:

- **`app/(app)/layout.tsx`**: layout compartido para las páginas que sí requieren cuenta
  (Empresas, Talento, Mi perfil, Mi empresa). Verifica sesión (redirige a `/login` si no hay),
  muestra la nav. **Corrección durante implementación**: `/` NO puede vivir en este grupo — la
  portada es pública por decisión ya tomada (contexto institucional + botón Ingresar para
  visitantes sin cuenta), y este layout redirigiría a cualquiera sin sesión, rompiendo esa
  portada. En vez de mover `app/page.tsx`, la nav se extrajo a **`components/AppNav.tsx`**,
  reusada por el layout de `(app)` y, condicionalmente (solo si hay sesión), por `app/page.tsx`
  directamente.

## Componentes y orden de construcción

1. **Esquema Prisma**: `Company` y `TalentProfile`, con sus relaciones a `User`/`Cohort` y
   `onDelete: Cascade` en `ownerId`. Una sola migración para ambos modelos.
2. **`components/Avatar.tsx`**: iniciales sobre color si no hay `logoUrl`/`photoUrl` — compartido.
3. **`lib/companies.ts`** y **`lib/talent.ts`**: helpers de completitud (`isCompanyComplete`,
   `isProfileComplete`) y queries reusables. Puros donde se pueda, para tests unit rápidos.
4. **`app/(app)/layout.tsx`**: nav compartida (ver arriba). Depende de (1) solo para tipos, no de
   datos todavía.
5. **Seed ampliado**: 6-8 emprendedores + empresas ficticias, 8-10 empleables + perfiles
   ficticios, con contenido creíble y variado (sectores distintos, tonos distintos) — no
   "Empresa 1, Empresa 2". Depende de (1).
6. **Páginas de empresas**: `/empresas` (lista), `/empresas/[id]` (detalle),
   `/empresas/mia` + `actions.ts` (autoedición con verificación de dueño). Depende de (1)-(3).
7. **Páginas de talento**: `/talento` (lista), `/talento/[id]` (detalle — con la ocultación de
   estado laboral resuelta en el server component, no en el cliente), `/perfil` + `actions.ts`.
   Depende de (1)-(3).
8. **Tests**: unit de los helpers de completitud y de la lógica de visibilidad de estado laboral;
   e2e de listas accesibles, detalle oculta/muestra estado laboral correctamente, autoedición
   crea/actualiza, y que un usuario no pueda editar el recurso de otro.

**Paralelizable:** (6) y (7) son independientes entre sí una vez lista (1)-(4); pueden ir a la vez.
**Secuencial:** (1) → (2)-(4) → (5) → (6)/(7) → (8).

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El estado laboral se oculta solo visualmente (CSS/condicional en cliente) en vez de no venir en los datos | Alto: filtraría el dato sensible igual, solo escondido — viola el boundary ya definido | El server component arma el objeto que le pasa al cliente ya sin esos campos cuando `employmentStatusVisible` es falso y quien mira no es dueño/admin, en vez de recibir todo y ocultar con CSS |
| Contenido de seed poco creíble (texto tipo lorem ipsum) | Medio: la primera impresión de EAFIT en el demo depende de esto | Escribir a mano nombres, rubros y descripciones variadas y realistas, no generadas por plantilla |
| Reestructurar `app/page.tsx` a `app/(app)/page.tsx` rompe algo que ya funciona | Bajo | Es un solo `mv` + ajustar el layout; correr build/test/e2e completos después del movimiento antes de seguir |
| Inestabilidad intermitente del pooler de Supabase (ya vista varias veces) | Bajo-medio, ya mitigado | Mismo patrón de reintentos ya usado en los helpers de e2e; no es nuevo aquí |

## Checkpoints de verificación

- **A — Esquema listo:** migración aplicada; `Company` y `TalentProfile` visibles en la DB.
- **B — Seed creíble:** revisar a ojo el contenido generado antes de seguir — si se ve genérico,
  reescribirlo antes de construir las páginas encima.
- **C — Navegación funcional:** con cualquier cuenta de prueba, se puede llegar a Empresas y
  Talento desde la nav, sin escribir URLs a mano.
- **D — Autoedición correcta:** un emprendedor/empleable de prueba crea y edita su propio
  recurso; intentar editar el de otro (forzando la URL/acción) falla.
- **E — Visibilidad de estado laboral:** verificado con un perfil en cada estado (visible/oculto)
  desde una cuenta que no es ni el dueño ni admin.
- **F — Cierre:** checklist de ambos `SPEC-*.md` en verde + `npm run test` y `npm run test:e2e`
  pasan.

## Estimación de tiempo

~1.5-2 días de los que quedan del plazo — más superficie que `identity` (dos modelos, tres
páginas por módulo, más el layout compartido nuevo), pero sobre patrones ya probados (Server
Actions con verificación de dueño, seed extendido, tests con el mismo estilo).
