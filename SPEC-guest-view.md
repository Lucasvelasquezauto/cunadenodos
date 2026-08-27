# Spec: guest-view

Módulo del Capability Map (ver `CAPABILITY-MAP.md`). Depende de `identity`, `directory-companies`,
`directory-talent` — los tres ya construidos y verificados. Reemplaza el stub de prueba en
`app/guest-check/page.tsx` (creado durante `identity` solo para poder probar el toggle admin antes
de que este módulo existiera).

## ASSUMPTIONS I'M MAKING

1. **El estado laboral nunca se muestra a un invitado**, sin importar el valor de
   `employmentStatusVisible` de la persona. Ese campo controla visibilidad *entre miembros
   registrados del grupo curado* (ya definido en `directory-talent`); un visitante anónimo de una
   feria es un público distinto y más amplio — asumo el criterio más conservador por defecto.
2. **El link de contacto opcional (`contactLink`) sigue la regla ya decidida en
   `CAPABILITY-MAP.md`**: se muestra a invitados solo si `contactLinkPublic` es verdadero — esto ya
   aplica igual para registrados, no es nuevo.
3. **El LinkedIn de un empleable SÍ se muestra a invitados** (a diferencia del `contactLink`
   genérico) — es un perfil profesional que la persona ya hizo público al ponerlo en el board, y
   ocultarlo iría en contra del propósito mismo de una feria de empleo (que alguien externo pueda
   seguir la conversación). Si esto no es lo que se quiere, es fácil invertirlo.
4. **Renombro la ruta** de `/guest-check` (nombre de stub técnico) a **`/invitado`** — es la URL que
   vería un visitante real en una feria, vale la pena que sea legible. El link "Ver como invitado"
   en `/` se actualiza para apuntar ahí.
5. **Estructura de páginas**: `/invitado` (landing propia, no la misma portada institucional),
   `/invitado/empresas` y `/invitado/empresas/[id]`, `/invitado/talento` y `/invitado/talento/[id]`
   — mismos datos que las versiones autenticadas, pasados por una redacción más estricta antes de
   llegar a la página (nunca solo ocultos en el render).
6. **Sin "Contactar"**: el modelo de solicitud/aceptación de `messaging` requiere cuenta en ambos
   lados — un invitado no tiene cuenta, así que no inicia conversaciones desde aquí. Su único canal
   es el `contactLink`/LinkedIn si la persona los hizo públicos (Asunciones 2-3).
7. **Toggle ya existente se reusa tal cual**: `getGuestModeEnabled()` (`lib/settings.ts`) ya
   controla esto desde `identity`; este módulo no toca el panel admin, solo consume el flag.

→ Corrígeme ahora o sigo con esto.

## Objective

Vista pública, sin sesión, de los directorios de empresas y talento — versión resumida sin datos
sensibles — para que el board sea presentable en una feria de empleo a alguien que todavía no tiene
cuenta. Activable/desactivable por el admin (ya construido). Reemplaza el stub de prueba de
`identity`.

**Quién lo usa:** cualquier visitante sin cuenta, solo cuando el admin activó el modo invitado
desde `/admin/settings`. No hay diferencia de vista entre "tipos" de invitado — es una sola
experiencia de solo lectura.

**Éxito para este módulo:** con el modo invitado activo, cualquier persona sin sesión puede navegar
`/invitado` → lista de empresas → detalle de una empresa, y lo mismo para talento, sin poder ver
estado laboral en ningún caso y sin poder llegar a ninguna página que requiera cuenta; con el modo
invitado desactivado, `/invitado` y sus subrutas muestran "no disponible" en vez de datos.

## Tech Stack, Commands, Code Style, Testing Strategy

Iguales a `SPEC-identity.md`. No se repiten aquí.

## Project Structure (nuevo)

```
app/guest-check/page.tsx        → se elimina (stub de prueba, ver Asunción 4)
app/invitado/page.tsx           → landing del modo invitado
app/invitado/empresas/page.tsx      → lista resumida
app/invitado/empresas/[id]/page.tsx → detalle resumido
app/invitado/talento/page.tsx       → lista resumida
app/invitado/talento/[id]/page.tsx  → detalle resumido
lib/talent.ts                   → sin función nueva — se reusa serializeTalentProfile(record, null);
                                   solo se corrigió el orden de chequeo en canSeeEmploymentStatus
                                   (ver tasks/plan-guest-view.md)
app/page.tsx                    → el link "Ver como invitado" pasa de /guest-check a /invitado
```

## Boundaries

- **Always:** cada página de `/invitado/*` empieza verificando `getGuestModeEnabled()` — si es
  falso, "no disponible", sin tocar la base de datos de empresas/talento; la redacción del estado
  laboral ocurre en la capa de datos (mismo criterio que `directory-talent`), nunca solo en el JSX.
- **Ask first:** cualquier campo nuevo que se considere "sensible" y no esté ya cubierto por las
  asunciones de arriba.
- **Never:** exponer `isEmployed`/`isSeekingWork` a `/invitado/*` bajo ninguna condición; dar acceso
  de escritura o de mensajería desde estas rutas; redirigir `/empresas` o `/talento` (las rutas
  autenticadas) a esta vista cuando no hay sesión — siguen redirigiendo a `/login`, sin cambios.

## Success Criteria

- [x] Con modo invitado activo: `/invitado` navegable sin sesión, con links a empresas y talento.
- [x] `/invitado/empresas` y `/invitado/empresas/[id]` muestran los mismos datos que ya son
      públicos para registrados (nombre, tagline, sector, descripción, propósito, valores,
      fundadores, sitio web, contacto solo si `contactLinkPublic`).
- [x] `/invitado/talento` y `/invitado/talento/[id]` muestran perfil, áreas de experiencia,
      posgrados, motivaciones, LinkedIn — **nunca** estado laboral, verificado a nivel de datos
      servidos (no solo ocultos en el HTML), incluso para perfiles con `employmentStatusVisible:
      true` — verificado con e2e y en navegador con el perfil de Carlos Ruiz (visible, sin empleo).
- [x] Con modo invitado desactivado: las 5 rutas de `/invitado/*` muestran "no disponible" sin
      exponer ningún dato (el gate vive en `app/invitado/layout.tsx`, no repetido por página).
- [x] `/` actualiza el link "Ver como invitado" a `/invitado`; `/guest-check` deja de existir.
- [x] `npm run test` y `npm run test:e2e` pasan en verde (26 unit, 19 e2e).

## Open Questions

1. ¿La lista de empresas/talento para invitados debería ser la lista **completa** de las 30/70
   personas, o tiene sentido limitarla/paginarla para una feria (ej. mostrar solo highlights)? Asumí
   la lista completa por simplicidad — es lo mismo que ya se muestra a registrados, solo con menos
   campos por persona, no menos personas.
2. Confirmar Asunción 3 (LinkedIn visible a invitados) — es la que más se aparta de "resumido sin
   datos sensibles" tomado al pie de la letra, aunque tiene sentido dado el propósito de feria.
