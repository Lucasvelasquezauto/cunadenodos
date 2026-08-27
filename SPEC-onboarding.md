# Spec: onboarding

Módulo del Capability Map (ver `CAPABILITY-MAP.md`). Depende de `directory-companies`,
`directory-talent` — ambos construidos y verificados. Último módulo del build order.

## Antes que nada: qué de "onboarding" ya está construido

El brief original agrupaba "auto-registro + consentimiento granular" en un solo entregable. El
auto-registro **ya existe**, construido en `identity`: `/invite/[token]` — un link por cohorte
(no por persona) que cualquiera de los ~100 usa para crear su cuenta eligiendo su ruta
(emprendedor/empleable), y luego `/empresas/mia` / `/perfil` (de `directory-companies`/
`directory-talent`) para llenar su propia información. Lo que falta de verdad es:

1. **Consentimiento granular** — nunca construido, es la pieza legal/ética real de este módulo.
2. **El banner persistente de "completa tu perfil"** — decidido en la sección "Arquitectura de
   entrada y navegación" de `CAPABILITY-MAP.md` (2026-08-26) pero nunca implementado durante
   `directory-companies`/`directory-talent`. Lo incluyo aquí como parte de cerrar el módulo, no
   porque sea nuevo — es terminar algo ya acordado.

## ASSUMPTIONS I'M MAKING — y una advertencia sobre esta parte en particular

Esto es lo único del proyecto donde no me siento cómodo asumiendo libremente: es consentimiento
legal de datos personales de 100 personas reales, bajo la Ley 1581 de 2012 (Habeas Data,
Colombia). Lo que propongo abajo es una estructura razonable, **no texto legal validado** — si
EAFIT tiene un área jurídica/de cumplimiento, el texto exacto de cada consentimiento debería
salir de ahí, no de mí. Lo marco explícitamente en vez de inventarlo con confianza.

1. **Dos categorías de consentimiento, no una casilla única "acepto todo" — confirmado por el
   usuario, sin una tercera categoría separada para modo invitado:**
   - **(a) Tratamiento de datos personales** — obligatorio para poder tener cuenta (Habeas Data,
     genérico: nombre, correo, la info que decida compartir). Sin este, no se crea la cuenta.
   - **(b) Visibilidad en el directorio del programa** — que su perfil/empresa lo vean los otros
     ~100 miembros del programa (institución incluida), **y que la plataforma se pueda presentar
     en ferias gremiales/de empleo** (modo invitado) — el usuario decidió que esto va bundled
     dentro de (b), no como opt-in aparte. También obligatorio.
2. **Sin cambios a `guest-view`**: como (c) ya no existe, no hace falta ningún filtro nuevo en
   `/invitado/*` — sigue mostrando a todos los que ya están en el directorio, tal como está hoy.
3. **Dónde se captura**: como un paso dentro de `/invite/[token]` (antes de crear la cuenta, no
   después) — (a) y (b) como checkboxes requeridos. Se guarda en `User` con timestamp de cuándo
   se dio cada uno (no un modelo aparte con versionado — ver Open Questions).
4. **Alguien que ya tiene cuenta hoy** (los 5 usuarios reales que EAFIT/ANDI ya conocen, si migran
   del registro parcial que EAFIT ya tiene) — no pasó por este flujo. Asumo que el admin puede
   marcar consentimiento retroactivo a mano desde `/admin/users`, o que se les pide re-confirmar
   la primera vez que entran — a decidir en Plan, no lo resuelvo aquí.
5. **El banner de perfil incompleto** es informativo, no bloqueante — como ya se había decidido:
   se puede navegar todo el sitio igual, solo la acción de "Contactar" queda bloqueada (ya
   construido en `messaging`). El banner solo es el recordatorio visual que faltaba.

→ Corrígeme antes de que siga si algo de esto no es lo que quieres — especialmente el texto de
(b), que ahora menciona ferias explícitamente y vale la pena que confirmes la redacción.

## Objective

Cerrar el ciclo de alta de un participante real: consentimiento explícito y granular antes de
tener cuenta, y un recordatorio persistente (no bloqueante) de que falta completar el perfil.

**Quién lo usa:** cualquiera que se registre por `/invite/[token]` de ahora en adelante.

**Éxito para este módulo:** nadie puede crear una cuenta sin aceptar (a) y (b); cualquier cuenta
con perfil/empresa incompleto ve un banner persistente (no descartable del todo) en las páginas
autenticadas, con link directo a completarlo.

## Tech Stack, Commands, Code Style, Testing Strategy

Iguales a `SPEC-identity.md`. No se repiten aquí.

## Project Structure (nuevo)

```
prisma/schema.prisma            → + campos de consentimiento en User (ver modelo abajo)
app/invite/[token]/page.tsx     → + sección de consentimiento en el formulario
app/invite/[token]/actions.ts   → guarda los 2 campos al crear el User
components/ProfileReminderBanner.tsx → banner persistente, condicional a perfil/empresa incompleto
app/(app)/layout.tsx            → renderiza el banner cuando aplica
```

## Modelo de datos

```prisma
// En User:
consentDataProcessingAt DateTime?  // (a) — obligatorio, null = cuenta no debería existir
consentDirectoryAt      DateTime?  // (b) — obligatorio, incluye ferias/modo invitado
```

## Boundaries

- **Always:** (a) y (b) son requeridos en el formulario — sin ambos marcados, `joinWithInvitation`
  rechaza la creación de la cuenta, mismo patrón que ya usa para "falta email"/"falta ruta".
- **Ask first:** el texto exacto de cada consentimiento (ver advertencia arriba); cualquier cambio
  a cómo se trata a las 5 cuentas ya existentes (Asunción 4).
- **Never:** crear una cuenta sin que ambos consentimientos queden registrados con su timestamp.

## Success Criteria

- [x] `/invite/[token]` no crea la cuenta si (a) o (b) no están marcados — verificado también
      saltándose la validación nativa del navegador, para probar el rechazo real del servidor.
- [x] Banner de perfil incompleto visible en páginas autenticadas (`/` y todo `(app)`) para
      emprendedor/empleable con perfil/empresa incompleto; desaparece al completarlo; ausente para
      institución/admin (no tienen perfil que completar, y no navegan por `(app)` de todas formas).
- [x] `npm run test` y `npm run test:e2e` pasan en verde (26 unit, 24 e2e).

## Open Questions (resueltas 2026-08-26)

1. **Texto legal**: confirmado — texto genérico pero claro, apoyado en la norma real colombiana
   (Ley 1581 de 2012 y su decreto reglamentario, Decreto 1377 de 2013 — Habeas Data), marcado para
   que el área jurídica de EAFIT lo valide/ajuste antes del lanzamiento real. **No** se muestra
   ningún aviso de "pendiente de revisión" en la interfaz — el texto se ve terminado y profesional
   para quien se registre durante la demo; la nota de "falta validación legal" es para EAFIT, va
   en este spec, no en la pantalla. Texto propuesto (a ajustar en Plan/implementación):

   - **(a)** "Autorizo el tratamiento de mis datos personales, conforme a la Ley 1581 de 2012 y
     el Decreto 1377 de 2013, para los fines propios de mi participación en la Beca SER ANDI:
     contacto, comunicación y seguimiento dentro del programa."
   - **(b)** "Autorizo que la información de mi perfil (nombre, empresa o experiencia, y los demás
     datos que decida compartir) sea visible para los demás participantes del programa, la
     Universidad EAFIT y ANDI dentro de esta plataforma, incluyendo su presentación en ferias u
     otros eventos gremiales o de empleo relacionados con la Beca SER ANDI."

2. **Cuentas ya existentes**: confirmado — no importa, son de demo. Se tratan como si ya hubieran
   consentido (`consentDataProcessingAt`/`consentDirectoryAt` poblados retroactivamente para las
   cuentas de seed, sin pedirles nada).
3. **Banner**: confirmado — siempre visible mientras el perfil/empresa esté incompleto, sin botón
   para cerrarlo del todo.
