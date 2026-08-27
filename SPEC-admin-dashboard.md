# Spec: admin-dashboard

Módulo del Capability Map (ver `CAPABILITY-MAP.md`). Depende de `messaging`, `directory-companies`,
`directory-talent` — los tres ya construidos y verificados. Incluye la vista de metadatos de
conversaciones que quedó explícitamente asignada a este módulo en `SPEC-messaging.md`.

## ASSUMPTIONS I'M MAKING

1. **No es parte de `/admin/*`.** El panel `/admin` de hoy (Usuarios, Cohortes, Invitaciones, Modo
   invitado) es de gestión, exclusivo del rol `ADMIN`. Las métricas las necesitan **también**
   institución (EAFIT/ANDI) — que no tiene panel propio hoy, solo navega los directorios igual que
   emprendedor/empleable. Creo una ruta nueva, **`/metricas`**, con su propio layout gateado a
   `ADMIN` **e** `INSTITUCION` (no a emprendedor/empleable), separada de `/admin/*`. Admin ve ambas
   cosas (su panel de gestión + este); institución solo ve `/metricas`.
2. **"Vistas" queda fuera de v1.** El capability map menciona "vistas" junto a "conexiones" y
   "completitud de datos", pero no existe ninguna infraestructura de tracking hoy (ni modelo de
   datos, ni instrumentación en las páginas de perfil) — construirla es un módulo en sí mismo
   (decidir qué cuenta como "vista", evitar que se infle con el propio dueño mirando su perfil,
   etc.). Propongo cortarlo de v1 y dejarlo como candidato v2, igual que "insignias de
   verificación" ya listado en `CAPABILITY-MAP.md`. Si esto es importante para la demo con EAFIT,
   dímelo y lo replanteamos antes de Plan.
3. **"Conexiones" = metadatos de conversaciones**, tal como se decidió en `SPEC-messaging.md`: para
   cada conversación, quién la inició, con quién, y su estado (`PENDING`/`ACCEPTED`/`DECLINED`) —
   nunca los mensajes. Se muestra como una lista/tabla, no solo un conteo agregado, porque
   "quién conversa con quién" fue la frase exacta de la decisión ya tomada.
4. **"Completitud de datos"** = cuántas de las empresas y cuántos de los perfiles de talento pasan
   `isCompanyComplete`/`isProfileComplete` (ya existentes en `lib/companies.ts`/`lib/talent.ts`) —
   ej. "24 de 30 empresas completas", "58 de 70 perfiles completos". Sin desglose por campo
   individual en v1 (cuál campo falta) — eso es una mejora razonable pero no la pido por defecto.
5. **Solo lectura, sin exportar/descargar** — nada de CSV ni impresión en v1.

→ Corrígeme ahora o sigo con esto.

## Objective

Un tablero de métricas de solo lectura para EAFIT/ANDI (y admin) — conexiones (metadatos de
conversaciones, sin contenido), completitud de datos de empresas y talento — para que quien opera
el programa pueda ver qué tan viva está la red sin necesidad de auditar cuenta por cuenta.

**Quién lo usa:** `ADMIN` e `INSTITUCION` (EAFIT y ANDI). Nadie más.

**Éxito para este módulo:** con una cuenta admin o institución, `/metricas` muestra el número de
empresas/perfiles completos vs. el total, y una lista de todas las conversaciones (iniciador,
receptor, estado) sin exponer ningún mensaje; con cualquier otro rol, `/metricas` no es accesible.

## Tech Stack, Commands, Code Style, Testing Strategy

Iguales a `SPEC-identity.md`. No se repiten aquí.

## Project Structure (nuevo)

```
app/metricas/layout.tsx   → gate: requiere sesión + rol ADMIN o INSTITUCION
app/metricas/page.tsx     → completitud (empresas, talento) + lista de conversaciones
lib/permissions.ts        → + prefijo "/metricas" en el chequeo de rutas (ADMIN o INSTITUCION)
components/AppNav.tsx     → + link "Métricas" condicional a ADMIN/INSTITUCION
```

## Boundaries

- **Always:** verificar el rol en el layout (server-side, como `(app)/layout.tsx` y
  `admin/layout.tsx`) antes de consultar conversaciones; la query de conversaciones nunca hace
  `select` ni `include` sobre `Message` — ni por accidente, ni "para contar cuántos mensajes tiene".
- **Ask first:** cualquier forma de exportar/imprimir estos datos; desglose de completitud por
  campo individual; tracking de vistas (ver Asunción 2).
- **Never:** que `/metricas` sea alcanzable por `EMPRENDEDOR` o `EMPLEABLE`; exponer el cuerpo de
  ningún `Message` en esta vista, bajo ninguna circunstancia.

## Success Criteria

- [x] `/metricas` accesible con `ADMIN` o `INSTITUCION`; redirige con cualquier otro rol (incluida
      una sesión de `EMPRENDEDOR`/`EMPLEABLE`, verificado en navegador y e2e).
- [x] Completitud: cuenta correcta de empresas completas/totales y perfiles completos/totales,
      verificada contra los datos de seed (7/7 empresas, 9/9 perfiles en el estado actual del seed).
- [x] Conexiones: lista todas las conversaciones existentes (iniciador, receptor, estado) sin
      mostrar el contenido de ningún mensaje — la query nunca toca `Message`, verificado también
      con un test e2e que busca el texto real de un mensaje del seed y confirma que no aparece.
- [x] `npm run test` y `npm run test:e2e` pasan en verde (26 unit, 22 e2e).

## Open Questions (resueltas 2026-08-26)

1. Corte de "vistas" de v1 (Asunción 2): confirmado.
2. Nombres reales en la lista de conversaciones para institución también: confirmado.
