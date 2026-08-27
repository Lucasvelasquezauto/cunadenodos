# Plan: identity

Fase 2 (Plan) del módulo `identity`, sobre `SPEC-identity.md` ya aprobado.

> Nota: la skill `spec-driven-development` remite a una skill canónica
> `planning-and-task-breakdown` para el detalle de descomposición y grafo de dependencias; esa
> skill no está instalada en este entorno. Este plan sigue el resumen liviano incluido en la
> propia skill de spec-driven-development.

## Decisiones técnicas de este módulo

- **Base de datos: Supabase (Postgres administrado)**, no solo por ser Postgres portable, sino
  porque los módulos `directory-companies`/`directory-talent` van a necesitar almacenar fotos/logos
  (Supabase Storage) y `messaging` se beneficia de su capa realtime más adelante — evita adoptar un
  segundo proveedor después. Se accede vía Prisma con el connection string de Supabase, no con su
  SDK propio, así que migrar a otro Postgres (ej. el hosting de EAFIT) más adelante es solo cambiar
  `DATABASE_URL`.
- **Estrategia de sesión: sesiones en base de datos** (no JWT) vía `@auth/prisma-adapter`. Motivo:
  el requisito "el admin elimina una cuenta y esa persona pierde acceso de inmediato" solo se
  cumple de forma confiable con sesiones en DB — con JWT, una sesión ya emitida seguiría siendo
  válida hasta expirar aunque se borre el usuario.
- **Modo invitado**: una tabla `AppSettings` de una sola fila (`guestModeEnabled: boolean`),
  editable desde el panel admin. Se consulta en `middleware.ts` en cada request a rutas guest.
- **Correo en desarrollo**: en vez de enviar correos reales durante todo el desarrollo, el magic
  link se imprime en consola (modo dev de Auth.js) para no depender de Resend en cada prueba;
  Resend se activa para el demo real que se le muestra a EAFIT.

## Addendum (2026-08-25): links de invitación

Se agrega al alcance del módulo, como mitigación directa al riesgo de dominio de correo no
verificado: un modelo `InvitationLink` (token, cohortId, expiresAt) generable desde el panel
admin, más una ruta `/invite/[token]` que crea la cuenta al primer uso. Esto añade dos componentes
al orden de construcción (entre 5 y 6 de la lista original) y reduce el impacto del riesgo de
Resend de "Alto" a "Medio", porque ahora hay una vía de distribución manual integrada al producto
en vez de depender solo del log de consola en dev.

## Componentes y orden de construcción

1. **Scaffolding**: Next.js 14 (App Router) + TypeScript + Tailwind + ESLint/Prettier + Vitest +
   Playwright configurados. Nada más depende de que esto exista.
2. **Esquema Prisma + migración inicial**: `User`, `Cohort`, `AppSettings`, enum `Role`, campo
   `org` en usuarios de rol institución, tablas de Auth.js (`Account`, `Session`,
   `VerificationToken`). Requiere una base Supabase creada (dev branch/proyecto gratuito).
3. **Auth.js v5 + adapter Prisma + provider Email**: login cerrado — el `signIn` callback rechaza
   correos que no existan ya como `User` en la base. Depende de (2).
4. **Script de seed**: 1 cohorte activa + 5 usuarios ficticios (admin, emprendedor, empleable,
   institución/EAFIT, institución/ANDI). Depende de (2); puede construirse en paralelo a (3).
5. **`middleware.ts`**: protección de rutas por rol + verificación de `AppSettings.guestModeEnabled`
   para rutas guest. Depende de (3).
6. **UI de admin**: páginas para crear/desactivar/eliminar usuarios y cohortes, y el switch de modo
   invitado. Depende de (5).
7. **Páginas de login/verificación** en español (`/login`, `/verify-request`) y stub `/guest-check`
   para probar el toggle. Depende de (3) y (5).
8. **Tests**: unit de `hasRole`/`canAccessRoute`/lógica del toggle (pueden escribirse en paralelo a
   cada componente, no solo al final); e2e de los tres flujos del spec. Depende de todo lo anterior
   para el e2e; los unit pueden ir avanzando desde (3)-(5).

**Paralelizable:** (4) con (3); tests unit con (3)-(6) a medida que cada pieza queda lista.
**Secuencial estricto:** (1) → (2) → (3) → (5) → (6)/(7).

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Dominio de envío de Resend no verificado (aún no hay dominio institucional de EAFIT disponible) → magic links caen en spam | Alto: si el login falla para usuarios reales, se cae toda la plataforma | Para el demo, login en modo dev (link en consola, sin depender de email real); antes del lanzamiento real, verificar dominio propio o pedir a EAFIT autorización de un subdominio, y agregar aviso visible "revisa spam" + botón de reenvío |
| Integración Auth.js v5 + adapter Prisma + Email provider tiene fricción de configuración (session strategy, callbackUrls, CSRF) | Medio: puede consumir más de 1 día de los ~10 disponibles | Timebox de 1 día; si se traba, fallback a un flujo custom simple (tabla de tokens de un solo uso + ruta `/verify` propia) en vez de pelear con la librería |
| No hay Postgres local en la máquina de desarrollo (Windows) | Bajo | Usar Supabase (o Neon) en la nube desde el día 1, no Postgres local — mismo approach que ya se necesita para el demo igualmente |
| Sesiones en DB agregan una tabla/consulta extra vs. JWT | Bajo | Aceptado a cambio de revocación inmediata, que es un requisito explícito del spec |

## Checkpoints de verificación

- **A — Esquema listo:** `npx prisma migrate dev` corre limpio; `npx prisma studio` muestra las
  tablas esperadas.
- **B — Auth funcional:** con un usuario seed, pedir magic link, verlo en consola (dev), entrar, y
  quedar autenticado con el rol correcto.
- **C — Middleware correcto:** usuario `emprendedor` bloqueado en `/admin/*`; `/guest-check`
  bloqueado con modo invitado OFF, accesible con ON.
- **D — UI admin funcional:** crear/desactivar/eliminar usuario y cohorte desde el panel, no solo
  por seed/DB directa.
- **E — Cierre del módulo:** checklist completo de `SPEC-identity.md` en verde + `npm run test` y
  `npm run test:e2e` pasan.

## Estimación de tiempo

~1 a 1.5 días de los ~10 disponibles para todo el proyecto. Si el checkpoint B no se alcanza en el
primer día, se activa el fallback de Auth.js mencionado arriba en vez de seguir depurando.
