# Spec: identity

Módulo base del Capability Map (ver `CAPABILITY-MAP.md`). Sin dependencias — todos los demás
módulos dependen de este.

## Objective

Dar a la plataforma un sistema de cuentas, roles y control de acceso sobre el que se construyen
todos los módulos siguientes (directorios, mensajería, dashboard, onboarding).

**Quién lo usa:**
- **Admin** (equipo del programa / quien construye y opera el sitio): crea, desactiva y elimina
  cuentas; gestiona cohortes; controla el interruptor de modo invitado; genera links de invitación
  y puede copiar el link de acceso (magic link) de cualquier usuario para reenviarlo manualmente si
  el correo automático no llega.
- **Emprendedor** (30 personas, ruta de emprendimiento): inicia sesión, gestiona el perfil de su
  empresa (en módulos futuros).
- **Empleable** (70 personas, ruta de empleabilidad): inicia sesión, gestiona su perfil personal.
- **Institución** (staff de EAFIT y de ANDI, mismo rol en v1, con campo interno `org` para poder
  diferenciar permisos más adelante): inicia sesión, accede a dashboard y directorios completos.
- **Invitado**: sin cuenta; accede solo si el admin activó el modo invitado, y solo a vistas
  resumidas construidas en módulos futuros.

**Éxito para este módulo específico:** un usuario de cada rol puede iniciar sesión y ver la
navegación/permiso correcto; el admin puede crear cohortes y usuarios, y prender/apagar el modo
invitado; las rutas protegidas rechazan a quien no tiene el rol correcto.

## Tech Stack

- Next.js 14+ (App Router), TypeScript, React
- PostgreSQL vía Prisma ORM
- Auth.js (NextAuth) v5, provider Email (magic link) vía Resend, con **dos puertas de entrada**:
  1. **`/login`** (cerrado): el magic link solo funciona para correos que ya existen como cuenta.
     Sin auto-registro abierto por esta vía.
  2. **`/invite/[token]`** (auto-registro controlado): el admin genera un link de invitación
     ligado a una cohorte (y opcionalmente a una ruta sugerida), visible y copiable en pantalla
     para distribuirlo por su propio correo/canal — no depende de que Resend envíe nada. Quien
     entra con ese link ingresa su correo y su ruta (emprendimiento/empleabilidad); ahí se crea su
     cuenta única (identidad), lista para seguir directo al formulario del módulo `onboarding` o
     para volver después con magic link normal y completar/editar su información.
  El control de acceso pasa de "lista cerrada de correos" a "posesión del link de invitación",
  distribuido solo por canales del programa — el admin puede revisar altas recientes y eliminar
  cualquier cuenta creada por error o de forma indebida.
- Tailwind CSS (variables de tema para paleta EAFIT/ANDI, definidas en un módulo de diseño
  compartido, no en `identity`)
- Vitest (unit), Playwright (e2e mínimo)
- Despliegue: Vercel + Postgres administrado (Neon o Supabase — se fija en el Plan técnico)

## Commands

```
Dev:      npm run dev
Build:    npm run build
Test:     npm run test              # Vitest, unit
Test e2e: npm run test:e2e           # Playwright
Lint:     npm run lint --fix
Typecheck: npm run typecheck         # tsc --noEmit
DB migrate: npx prisma migrate dev
DB seed:    npx prisma db seed       # crea cohorte + 1 usuario ficticio por rol
```

## Project Structure

```
app/                    → Next.js App Router (páginas y rutas)
app/(auth)/             → páginas de login / verificación de magic link
app/invite/[token]/     → auto-registro vía link de invitación (crea la cuenta única)
app/admin/            → páginas exclusivas de admin (cohortes, usuarios, toggle invitado,
                           generación de links de invitación, copia manual de magic links)
components/             → componentes UI compartidos
lib/auth.ts             → configuración de Auth.js, helpers de sesión/rol
lib/db.ts               → cliente Prisma
prisma/schema.prisma    → esquema de base de datos
prisma/seed.ts          → script de datos ficticios para el demo
middleware.ts           → protección de rutas por rol / chequeo de modo invitado
tests/                  → unit tests (Vitest)
e2e/                    → tests end-to-end (Playwright)
CAPABILITY-MAP.md       → mapa de módulos (raíz del repo)
SPEC-*.md               → specs de cada módulo (raíz del repo)
tasks/                  → plan.md y todo.md por módulo (se crean en fase Plan)
```

## Code Style

```ts
// Componentes funcionales, props tipadas explícitamente, sin `any`.
type CohortBadgeProps = { name: string; isActive: boolean };

export function CohortBadge({ name, isActive }: CohortBadgeProps) {
  return (
    <span className={isActive ? "badge badge-active" : "badge"}>
      {name}
    </span>
  );
}
```

- TypeScript en modo `strict`.
- Nombres de archivos de componentes en PascalCase; utilidades en camelCase.
- Sin comentarios que expliquen el "qué" — solo el "por qué" cuando no sea obvio (ej. una regla de
  negocio no evidente en el código).
- Server Actions / route handlers para mutaciones; nada de lógica de negocio en componentes de
  cliente.

## Testing Strategy

Dado el plazo de 10 días, el foco de testing en este módulo es el camino crítico, no cobertura
exhaustiva:

- **Unit (Vitest):** lógica de asignación/verificación de rol, helpers de permisos
  (`hasRole`, `canAccessRoute`), lógica del toggle de modo invitado.
- **E2E (Playwright), un solo flujo por rol:** login vía magic link (mockeado en test) → aterriza
  en la vista correcta; intento de acceso a ruta de admin sin permiso → redirige/rechaza; toggle
  de modo invitado en ON permite ver una ruta guest de prueba, en OFF la bloquea.
- No se persigue cobertura de porcentaje; se valida manualmente en el navegador antes de dar por
  cerrado el módulo (checklist en Success Criteria).

## Boundaries

- **Always:** correr `lint` y `typecheck` antes de cada commit; nunca usar datos reales de
  participantes en seeds/demo — solo datos claramente ficticios (ej. "Empresa Demo S.A.S.",
  "Ana Ejemplo"); modo invitado por defecto en OFF.
- **Ask first:** cambios al esquema de Prisma después de que este spec se apruebe; agregar
  dependencias externas nuevas (proveedor de email, hosting de DB); cambiar el mecanismo de auth
  (ej. pasar de magic link a contraseña).
- **Never:** commitear `.env`/secretos; hardcodear credenciales; guardar tokens de sesión en
  `localStorage` (deben ir en cookies httpOnly vía Auth.js); omitir el campo de cohorte en el
  modelo de usuario (rompería el soporte multi-cohorte futuro).

## Success Criteria

- [x] `npx prisma db seed` crea: 1 cohorte activa, y 1 usuario ficticio por cada rol (admin,
      emprendedor, empleable, institución×2 con `org: EAFIT` y `org: ANDI`).
- [x] Cada usuario seed puede iniciar sesión vía magic link (en dev, el link se imprime en
      consola en vez de enviarse por correo real). Verificado individualmente para los 5.
- [x] Admin ve un panel donde puede: crear una nueva cohorte, crear un nuevo usuario y asignarle
      rol + cohorte, y prender/apagar el modo invitado.
- [x] Un usuario con rol `emprendedor` que intenta entrar a una ruta `/admin/*` es redirigido /
      rechazado.
- [x] Con modo invitado en OFF, una ruta de prueba `/guest-check` (stub temporal, se reemplaza en
      el módulo `guest-view`) no es accesible sin sesión. Con modo invitado en ON, sí lo es.
- [x] Un intento de magic link con un correo que **no** existe como cuenta es rechazado con un
      mensaje claro (ej. "este correo no está registrado en el programa"), sin crear cuenta.
- [x] Admin puede desactivar/eliminar una cuenta existente; esa persona deja de poder iniciar
      sesión de inmediato (verificado: al borrar la sesión/cuenta, la siguiente petición redirige
      a /login).
- [x] Cada cuenta de rol `institución` es individual (no compartida entre personas de EAFIT/ANDI)
      y muestra su organización (`org`) de forma visible en la interfaz (saludo personalizado en
      "Hola, equipo EAFIT" / "Hola, equipo ANDI" en la portada), aunque los permisos sean
      idénticos entre EAFIT y ANDI en v1.
- [x] Admin genera un link de invitación desde el panel, lo ve en pantalla y puede copiarlo.
- [x] Visitar `/invite/[token]` con un correo nuevo crea una cuenta única (identidad) asociada a
      la cohorte y a la ruta elegida (emprendimiento/empleabilidad); esa persona puede volver más
      tarde con `/login` (magic link normal) usando el mismo correo — verificado end-to-end.
- [x] Un link de invitación vencido o inválido no crea cuenta y muestra un mensaje claro.
- [x] Admin puede ver las cuentas creadas recientemente vía invitación y eliminar cualquiera que
      no corresponda (lista de usuarios ordenada por fecha de creación descendente, con botón
      eliminar en cada fila).
- [x] Admin puede copiar desde el panel el magic link vigente de un usuario existente, para
      reenviarlo manualmente si el correo automático no le llegó.
- [x] `npm run test` y `npm run test:e2e` pasan en verde (10 tests unit, 8 tests e2e).

## Decisions Log

- **Magic link cerrado por invitación** (no auto-registro abierto): decidido 2026-08-25. Motivo:
  evitar que personas fuera del programa se inscriban solas; el admin controla quién tiene cuenta
  y puede eliminarla.
- **Resend confirmado** como proveedor de correo: decidido 2026-08-25.
- **Sin diferenciación de permisos EAFIT vs. ANDI en v1**: decidido 2026-08-25. Cada persona de
  cada institución tiene cuenta individual propia (no una cuenta compartida "institución"), lo que
  ya le da identidad y trazabilidad propia sin necesidad de separar permisos todavía. El campo
  `org` queda disponible para diferenciar más adelante si hace falta.

- **Links de invitación como puerta de auto-registro** (decidido 2026-08-25): dado que aún no hay
  dominio institucional verificado para envíos automáticos, el admin necesita poder distribuir el
  acceso manualmente. El link (visible/copiable en pantalla) reemplaza la dependencia de que
  Resend logre entregar el primer correo; además establece el momento exacto en que nace la
  identidad única de cada persona (al entrar con el link, no antes). El magic link normal
  (`/login`) sigue cerrado a cuentas ya existentes, y el admin conserva un botón para copiar el
  magic link de cualquier usuario como respaldo manual adicional.
- **Middleware Edge + verificación de rol en Node.js** (decidido 2026-08-25, durante
  implementación): `middleware.ts` corre en el runtime Edge de Next.js, que no puede usar el
  cliente estándar de Prisma/Postgres (incompatible con la estrategia de sesiones en base de datos
  que ya elegimos). Patrón adoptado (recomendado por el propio Auth.js): el middleware solo
  verifica que exista la cookie de sesión (redirige a `/login` si no hay ninguna — chequeo
  optimista, barato, sin DB); la verificación real de rol ocurre en `app/admin/layout.tsx`, que sí
  corre en Node.js y puede consultar la base de datos. Mismo patrón para el modo invitado: la
  verificación de `AppSettings.guestModeEnabled` ocurre dentro de la página `/guest-check`
  (Node.js), no en el middleware.
- **Endpoint de solo-test `/api/test/last-link`** (decidido durante implementación, T15): expone
  el último magic link generado en una tabla `LastLinkCache` (DB, no memoria — ver comentario en
  `prisma/schema.prisma`), para que Playwright pueda probar el flujo real de login sin leer la
  consola del servidor. Dos candados: nunca responde si `NODE_ENV=production`, y siempre exige un
  header `x-e2e-secret` que debe coincidir con `E2E_TEST_SECRET` (variable de entorno, no
  commiteada). No debe usarse fuera de los tests.

## Open Questions

1. El link de invitación, ¿debe ser único por cohorte completa (una sola URL para las 100
   personas, cada quien elige su ruta al entrar) o prefieres uno separado por ruta
   (emprendimiento/empleabilidad)? Asumo **uno solo por cohorte** con selección de ruta en el
   primer paso, por ser más simple de distribuir y administrar — corrígeme si no.
2. ¿El link de invitación debe expirar (ej. a los 30 días) o quieres que quede abierto
   indefinidamente para poder reutilizarlo con futuras cohortes? Asumo que **expira** y se genera
   uno nuevo por cohorte, para evitar que un link viejo filtrado siga funcionando meses después.
