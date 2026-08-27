# Capability Map: Board SER ANDI

Aprobado por el usuario el 2026-08-25. Renombrado de "Board EAFIT-ANDI" a "Board SER ANDI" el
2026-08-26, tras revisar los afiches oficiales del programa: el programa real se llama "Beca SER
ANDI", con EAFIT como operador (junto a NODO), no como co-marca igual a ANDI — ver `DESIGN.md`.

## Contexto

Plataforma web (board interactivo) para el cierre de un programa de formación EAFIT + ANDI.
~100 usuarios: 30 en ruta de emprendimiento (empresas ya registradas en Cámara de Comercio,
etapa inicial) y 70 en ruta de empleabilidad. Objetivo: red de contacto entre emprendedores,
talento en búsqueda de empleo/proyectos, la universidad y el patrocinador, con miras a que los
emprendedores posicionen/vendan y los de empleabilidad consigan empleo o proyectos.

Fecha límite dura: viernes 2026-09-05 (fin del programa). Hoy: 2026-08-25.

Plataforma pensada para persistir y alimentarse de futuras cohortes (no es un sitio de un solo uso).

## Restricción crítica de secuencia

EAFIT necesita ver un MVP funcional (con datos ficticios) **antes** de repartir el formulario
real de recolección de datos a los 100 participantes, para tener la confianza de distribuirlo.
Por eso el orden de build prioriza un demo end-to-end con datos semilla, y dejamos el formulario
de onboarding real (que escribe sobre el mismo esquema) para el final — pero su diseño de campos
se hace en paralelo a los módulos de directorio, no después.

## Mapa de módulos

| Module id            | Responsibility                                                                 | Depends on                         |
|-----------------------|---------------------------------------------------------------------------------|-------------------------------------|
| identity              | Cuentas, roles (admin, emprendedor, empleable, institución [EAFIT+ANDI unificado]), cohortes, toggle de modo invitado | —                                   |
| directory-companies   | Esquema + UI de perfiles de empresa (resumen y detalle); poblable con data ficticia para el demo | identity                            |
| directory-talent      | Esquema + UI del directorio de los 70 (perfil, experiencia, visibilidad de estado laboral, LinkedIn); poblable con data ficticia | identity                            |
| messaging             | Chat interno solicitud/aceptación, bidireccional; demostrable con cuentas ficticias | identity, directory-companies, directory-talent |
| guest-view            | Vista pública resumida, activable/desactivable por admin                       | identity, directory-companies, directory-talent |
| admin-dashboard       | Métricas para EAFIT/ANDI (conexiones, vistas, completitud de datos), incluida una vista de metadatos de conversaciones — quién conversa con quién y en qué estado, nunca el contenido (decidido en `SPEC-messaging.md`) | messaging, directory-companies, directory-talent |
| onboarding            | Formulario de auto-registro + consentimiento granular; escribe en el mismo esquema de directory-companies/directory-talent | directory-companies, directory-talent |

**Build order:** identity → directory-companies, directory-talent (con datos ficticios) →
messaging, guest-view → admin-dashboard → onboarding (diseño de campos en paralelo desde el
principio; construcción/lanzamiento al final, listo justo después de que EAFIT apruebe el demo)

## Decisiones ya validadas

- Aval institucional del proyecto: existe (EAFIT/ANDI conocen y respaldan la iniciativa).
- Mensajería: interna dentro de la app (modelo solicitud/aceptación), no enlaces externos a
  WhatsApp/LinkedIn.
- Roles EAFIT y ANDI: unificados en un solo rol "institución" para v1, pero con un campo interno
  `org: EAFIT | ANDI` para poder diferenciar permisos más adelante sin migrar el esquema.
- Stack: tecnologías estándar/portables (Next.js + Postgres), despliegue inicial en Vercel con
  plan de migrar a hosting propio de EAFIT (capacidad aún no confirmada).
- Vigencia: plataforma viva, pensada para alimentarse de futuras cohortes.

## Decisiones pendientes de aplicar en módulos futuros

- **Link de contacto opcional en modo invitado** (decidido 2026-08-25, aplica a
  `directory-talent`, `directory-companies` y `guest-view`): cada empleable o emprendedor puede,
  de forma opcional, entregar un link de contacto (WhatsApp, LinkedIn, sitio propio, etc.) que se
  muestra incluso a invitados no registrados, por si un externo en una feria quiere escribirle
  directamente. Es opt-in por persona/empresa, no un campo obligatorio ni expuesto por defecto.

- **Arquitectura de entrada y navegación** (decidido 2026-08-26, tras discusión de IA con el
  usuario — aplica a `directory-companies`, `directory-talent`, `messaging`, `guest-view`,
  `onboarding`):
  - **Frontpage (`/`) sin sesión**: contenido institucional (qué es la plataforma, de qué programa
    surge, las dos rutas EAFIT+ANDI) + una franja de cifras **indicativas** del programa (ej.
    "+100 participantes", "30 empresas" — placeholder hasta que EAFIT confirme las cifras reales;
    son del *programa*, no de uso de la plataforma, que arranca en cero). Diseño sobrio, no el
    cliché de "número gigante + gradiente".
  - **Dos puertas de entrada, no cuatro**: un solo botón **"Ingresar"** (mismo mecanismo de magic
    link para admin, emprendedor, empleable e institución — el rol ya está en la cuenta, no se
    elige al entrar) + un enlace secundario **"Ver como invitado"**, visible/activo solo cuando el
    admin prendió el modo invitado. Sin "crear cuenta" pública — sigue siendo solo por invitación
    o alta manual del admin.
  - **Sin muro de onboarding**: tras entrar por primera vez, la persona puede navegar y ver todo
    de inmediato. Un banner persistente (no descartable del todo) le recuerda completar su
    perfil/empresa. Lo que sí queda bloqueado hasta completar el propio perfil/empresa es la
    **acción de contactar** (botón "Contactar" deshabilitado con explicación) — no la navegación.
  - **Visibilidad de los directorios**: `directory-companies` y `directory-talent` son visibles
    **completos entre todos los roles con cuenta** (emprendedor, empleable, institución, admin),
    sin restricción cruzada por ruta — es un grupo de confianza curado de 100 personas, no un
    mercado público. La única vista restringida es la de invitados no registrados (resumida, sin
    datos sensibles, ya definida). El campo de estado laboral de un empleable mantiene su propio
    control de visibilidad por persona (ya definido en `identity`), independiente de esto.
  - **Mensajería bidireccional para institución también**: institución (EAFIT/ANDI) no es solo
    observador de métricas — puede iniciar y recibir mensajes igual que emprendedor/empleable
    (ej. para recomendar a alguien directamente).
  - **Modo invitado vive en su propio acceso**, no reemplaza el contenido de `/`, `/empresas` o
    `/talento` según si hay sesión — es una experiencia aparte, alcanzable solo desde "Ver como
    invitado" en el frontpage.

## Fuera de alcance v1 (candidatos a v2)

Insignias de verificación, códigos QR para feria, digest semanal por correo, muro de historias
de éxito, tablero estructurado de "oportunidades/necesidades" (más allá de mensajería libre).
