# Plan: admin-dashboard

Fase 2 (Plan) sobre `SPEC-admin-dashboard.md` ya aprobado (Open Questions resueltas: se corta
"vistas" de v1, nombres reales para institución en la lista de conversaciones).

## Corrección sobre el spec: `lib/permissions.ts#canAccessRoute` no protege nada hoy

El spec asumía extender el chequeo de prefijo de ruta en `lib/permissions.ts`. Al revisar
`middleware.ts` encontré que **`canAccessRoute` no se usa en ningún lado salvo su propio test** —
no es el mecanismo real de protección. Lo que de verdad protege `/admin` hoy es:

- `middleware.ts`: chequeo barato de "¿existe alguna cookie de sesión?" (runtime Edge, sin DB),
  con `matcher: ["/admin", "/admin/:path*"]`.
- `app/admin/layout.tsx`: el chequeo real de rol, con Prisma (runtime Node.js).

Y, dato importante: `/empresas`, `/talento`, `/mensajes` (bajo `(app)/layout.tsx`) **ni siquiera
están en el matcher de middleware** — se protegen solo con el chequeo de su propio layout, y
funciona igual de bien porque ese layout corre en el servidor antes de mandar cualquier HTML. Así
que `/metricas` sigue exactamente ese mismo patrón — **no hace falta tocar `lib/permissions.ts`
ni `middleware.ts`** — un layout nuevo con su propio `auth()` + chequeo de rol alcanza.

## Componentes y orden de construcción

1. **`app/metricas/layout.tsx`**: `auth()`; si no hay sesión, `redirect("/login")`; si el rol no es
   `ADMIN` ni `INSTITUCION`, `redirect("/")`. Mismo patrón que `app/admin/layout.tsx`, sin nav
   propia elaborada — un header simple con el logo y "Métricas" como único título de sección (no
   hace falta una nav con más links, esta es una sola página).
2. **`app/metricas/page.tsx`**:
   - Completitud: cuenta total y completos de `Company` (via `isCompanyComplete`) y de
     `TalentProfile` (via `isProfileComplete`) — dos queries `findMany` con solo los campos que
     esas funciones necesitan, filtradas en memoria (30 y 70 registros, no amerita nada más
     elaborado).
   - Conexiones: `prisma.conversation.findMany({ include: { initiator: {select:{name,email}},
     recipient: {select:{name,email}} }, orderBy: { createdAt: "desc" } })` — **sin** `include` de
     `messages`, ni siquiera un `count` de mensajes (el Boundary del spec es explícito: nunca tocar
     `Message` desde esta vista). Se renderiza como tabla: iniciador, receptor, estado, fecha.
3. **`components/AppNav.tsx`**: agregar link "Métricas" cuando `role === Role.ADMIN || role ===
   Role.INSTITUCION`, mismo patrón que los links condicionales ya existentes (Mi empresa, Mi
   perfil, Panel admin).
4. **Tests**: e2e — acceso permitido con admin e institución, denegado con emprendedor/empleable
   (verificado con `redirect` a `/`); conteos de completitud correctos contra los datos de seed;
   la lista de conversaciones no incluye ningún `body` de mensaje en el HTML servido (se verifica
   buscando que el texto de un mensaje real del seed, ej. el de la conversación pendiente de
   Julián→Carlos, no aparezca en `/metricas`).

**Secuencial:** (1) → (2) → (3) → (4).

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Copiar sin querer un `include: { messages: true }` al armar la query de conversaciones (patrón ya usado en `/mensajes`) | Alto — expondría contenido de mensajes a institución, justo lo que se prohibió explícitamente | La query de `/metricas` se escribe aparte, no se copia de `app/(app)/mensajes/page.tsx`; test e2e dedicado que busca el texto de un mensaje real y espera que no aparezca |
| Confundir `/metricas` con una ruta que necesita estar en el matcher de `middleware.ts` para ser segura | Bajo (ver corrección arriba) | Ya aclarado — el layout es la protección real, mismo patrón ya probado en `(app)` |
| Contar completitud sobre todos los campos de la tabla en vez de solo los que exige `isCompanyComplete`/`isProfileComplete` | Bajo | Reusar esas funciones tal cual, no reimplementar el criterio de "completo" a mano |

## Checkpoints de verificación

- **A — Gate correcto:** con emprendedor o empleable, `/metricas` redirige a `/`; con admin o
  institución, carga.
- **B — Completitud correcta:** los conteos coinciden con lo que ya se ve manualmente en
  `/empresas` y `/talento` (cuántos perfiles tienen todos los campos requeridos).
- **C — Sin contenido de mensajes:** verificado en navegador y e2e que ningún texto de mensaje real
  aparece en `/metricas`, con una cuenta institución.
- **D — Cierre:** checklist de `SPEC-admin-dashboard.md` en verde + `npm run test` y
  `npm run test:e2e` pasan.

## Estimación de tiempo

~0.5 día — la superficie más chica hasta ahora (una sola página nueva, sin modelo de datos nuevo,
sin acciones de escritura), aunque el chequeo de "nunca tocar Message" hay que probarlo con cuidado.
