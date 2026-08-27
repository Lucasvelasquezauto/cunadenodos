# Plan: guest-view

Fase 2 (Plan) sobre `SPEC-guest-view.md` ya aprobado.

## Pieza compartida no listada en el spec: gate centralizado en un layout

Repetir `if (!guestModeEnabled) return <NoDisponible />` en las 5 páginas de `/invitado/*` es
exactamente el tipo de duplicación que `app/(app)/layout.tsx` ya evita para el lado autenticado.
Se agrega **`app/invitado/layout.tsx`**: verifica `getGuestModeEnabled()` una sola vez — si es
falso, devuelve la tarjeta "No disponible" **sin renderizar `{children}`** (así ninguna subpágina
llega a consultar empresas/talento cuando el modo está apagado); si es verdadero, envuelve
`{children}` en un header liviano (logo + Empresas/Talento + "Ingresar", para alguien que sí tiene
cuenta y llegó aquí por error).

## Corrección real encontrada al revisar el código existente

`canSeeEmploymentStatus` en `lib/talent.ts` hoy es:

```ts
if (profile.employmentStatusVisible) return true;
if (!viewer) return false;
...
```

Con `viewer: null` (el caso de un invitado real, que hasta ahora nunca ocurría porque `/talento`
está detrás de `(app)/layout.tsx`), esto **muestra** el estado laboral si la persona lo dejó como
`employmentStatusVisible: true` — exactamente lo contrario de la Asunción 1 del spec ("nunca se
muestra a un invitado, sin importar el valor de ese campo"). Se corrige moviendo el chequeo de
`viewer` primero:

```ts
if (!viewer) return false;
if (profile.employmentStatusVisible) return true;
...
```

Esto no cambia ningún comportamiento visible hoy (viewer nunca es `null` en las rutas actuales),
solo habilita correctamente el caso nuevo. Se reusa `serializeTalentProfile` tal cual en las
páginas de invitado, pasando `null` como viewer — no hace falta una función paralela
"para invitados".

## Componentes y orden de construcción

1. **`lib/talent.ts`**: reordenar el chequeo en `canSeeEmploymentStatus` (ver arriba). Actualizar
   el test unit existente que cubre este caso.
2. **`app/invitado/layout.tsx`**: gate + header liviano. Depende de (1) solo indirectamente (nada).
3. **`app/invitado/page.tsx`**: landing corta (qué es esto, links a Empresas/Talento).
4. **`app/invitado/empresas/page.tsx`** y **`app/invitado/empresas/[id]/page.tsx`**: mismas
   queries que las versiones autenticadas (no hay redacción adicional para empresas — nada de lo
   que tienen se marcó como sensible), pero renderizadas sin nav de cuenta.
5. **`app/invitado/talento/page.tsx`** y **`app/invitado/talento/[id]/page.tsx`**: igual, pero el
   detalle pasa el registro por `serializeTalentProfile(record, null)` antes de renderizar — nunca
   accede a `record.isEmployed`/`record.isSeekingWork` directamente.
6. **`app/page.tsx`**: cambiar el href de "Ver como invitado" de `/guest-check` a `/invitado`.
7. **Eliminar `app/guest-check/page.tsx`** (stub de prueba de `identity`, ya no hace falta).
8. **Tests**: reescribir `e2e/guest-mode.spec.ts` sobre `/invitado` (toggle on/off) + agregar casos
   nuevos: lista y detalle de empresas/talento visibles con modo activo; estado laboral ausente en
   el detalle de un perfil con `employmentStatusVisible: true` (el caso que motivó la corrección
   de (1)); ninguna de las páginas de invitado ofrece "Contactar" ni acciones de escritura.

**Secuencial:** (1) → (2) → (3)/(4)/(5) en paralelo → (6)/(7) → (8).

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Reusar `serializeTalentProfile` sin la corrección de (1) filtraría estado laboral a invitados en perfiles con `employmentStatusVisible: true` | Alto — es el dato sensible explícito del spec original | Corrección ya identificada arriba, con test unit dedicado antes de construir las páginas |
| Alguna subruta de `/invitado/*` olvida pasar por el layout gate (ej. si se agrega una página fuera del árbol `app/invitado/`) | Medio | Todas las páginas nuevas viven estrictamente bajo `app/invitado/`, un solo layout las cubre a todas — no hay excepciones que mantener a mano |
| Confundir "resumido" con "editable/interactivo" y dejar algún botón de escritura visible por accidente (reusando JSX de las páginas autenticadas sin revisar) | Medio | Las páginas de invitado se escriben aparte, no se copian los componentes de `(app)/empresas` y `(app)/talento` tal cual — solo se reusan las queries y `serializeTalentProfile` |

## Checkpoints de verificación

- **A — Corrección de redacción:** test unit nuevo confirma `canSeeEmploymentStatus(perfil con
  employmentStatusVisible: true, null)` es `false`.
- **B — Gate funcional:** con modo invitado apagado, las 5 rutas de `/invitado/*` muestran "no
  disponible"; encendido, todas navegables sin sesión.
- **C — Sin datos sensibles:** verificado en navegador con un perfil de talento visible
  (`employmentStatusVisible: true`) que el estado laboral no aparece en `/invitado/talento/[id]`.
- **D — Sin acciones:** ninguna página de invitado tiene botón de "Contactar", editar, ni login
  implícito.
- **E — Cierre:** checklist de `SPEC-guest-view.md` en verde + `npm run test` y `npm run test:e2e`
  pasan.

## Estimación de tiempo

~1 día — menos superficie que `messaging` (sin modelo de datos nuevo, sin server actions de
escritura), pero con la corrección de redacción de por medio que hay que probar con cuidado.
