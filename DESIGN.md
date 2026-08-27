# Design

**Actualizado 2026-08-26** a partir de 4 afiches oficiales del programa (`assets/Poster1-4.jpg`),
reemplazando la paleta provisional del primer borrador. Esta es la identidad real del programa,
no una propuesta — se documenta lo observado, no se inventa.

## Lo que revelan los afiches

- El programa se llama **"Beca SER ANDI — Inteligencia Artificial"**, no "EAFIT-ANDI" a secas.
  "Un programa de:" SER ANDI Fondo Social (65 años) + ANDI Seccional Antioquia | Más País.
  "Operado por:" **NODO** + Universidad EAFIT. Aliados puntuales por evento: Acción Impro,
  Servicio Público de Empleo, Comfama.
- **Tema oscuro, no claro** — los 4 afiches son consistentemente fondo negro/casi negro con un
  brillo cálido dorado sutil (radial o textura de grano/rejilla), nunca fondo claro. Esto
  contradice la decisión anterior ("claro y limpio") tomada sin material de marca real — ver
  Open Questions.
- **Un solo acento: amarillo dorado**, usado con disciplina — nunca decorativo, siempre en
  elementos funcionales (botones, íconos, etiquetas, palabras clave dentro de un titular).

## Theme

Oscuro, fijo — igual que antes, no reacciona a `prefers-color-scheme`; ahora el valor fijo es
oscuro en vez de claro. `color-scheme: dark` explícito en `:root`.

## Color Strategy

**Committed** (no Restrained): el negro de fondo + el amarillo dorado cargan la identidad de
marca en cada pantalla — así se ve en los 4 afiches, con el amarillo apareciendo en cada uno sin
excepción.

Todos los valores en OKLCH, verificados contra WCAG AA (holgadamente — ver cálculo):

```css
--bg:        oklch(0.09 0 0);       /* negro casi puro */
--surface:   oklch(0.14 0.006 90);  /* paneles, ligeramente más claro, tinte cálido sutil */
--ink:       oklch(0.98 0 0);       /* texto principal — 19.5:1 sobre bg */
--muted:     oklch(0.75 0.01 90);   /* texto secundario — 9.3:1 sobre bg */
--line:      oklch(0.28 0.01 90);   /* bordes, divisores */

--accent:       oklch(0.87 0.17 95); /* amarillo dorado — 14:1 con negro y con texto negro encima */
--accent-hover: oklch(0.80 0.17 95);
--accent-ink:   oklch(0.09 0 0);     /* texto NEGRO sobre amarillo — así aparece en los 4 afiches, nunca blanco sobre amarillo */

--success: oklch(0.75 0.16 145);
--warning: oklch(0.80 0.15 70);
--error:   oklch(0.72 0.19 25);
```

**Regla de texto sobre amarillo, tomada directo de los afiches:** siempre texto negro (`--bg`),
nunca blanco — el amarillo es demasiado claro para texto blanco encima (patrón "pale fill → dark
text").

## Typography

Los afiches usan una sans-serif geométrica/redondeada en negrita para titulares (headline weight
muy alto, terminaciones redondeadas) y la misma familia en peso regular para cuerpo — coherente
con **Poppins**, ampliamente usada en piezas institucionales latinoamericanas y con ese mismo
carácter geométrico-redondeado. Se usa como aproximación fiel (no hay forma de leer metadata de
fuente desde un JPG) — confirmar con el usuario si el equipo de diseño del programa tiene el
nombre exacto de la fuente.

- Titulares: peso extra-bold/black, mayúsculas o frase normal según contexto, con 1-2 palabras
  clave resaltadas en `--accent` dentro del mismo titular (patrón repetido en los 4 afiches).
  `text-wrap: balance`.
- Etiquetas/eyebrows (`TALLER`, `OBJETIVO`, `PASO 1`, `NOTA`): mayúsculas, negrita,
  letter-spacing amplio, en `--accent` o `--ink`.
- Cuerpo: peso regular/medium, buen interlineado.

## Layout patterns (de los afiches, para reusar en el sitio)

- Logo/identidad centrada arriba.
- Titular grande de 2 líneas con palabra(s) clave en amarillo.
- Filas de ícono + etiqueta para datos puntuales (fecha, hora, lugar) — ícono en línea, color
  `--accent`.
- Cajas de contenido con esquinas redondeadas: o bien rellenas de amarillo con texto negro, o
  bien con borde amarillo fino y fondo oscuro.
- Botones/CTA en píldora (`rounded-full`), amarillo con texto negro en negrita.
- Pie con logos institucionales en blanco/escala de grises sobre el fondo oscuro
  ("Un programa de:" / "Operado por:"), y opcionalmente una franja blanca aparte para aliados con
  sus logos a color.

## Components (a reconstruir sobre esta base)

- `.btn-primary` → fondo `--accent`, texto `--accent-ink`, `rounded-full` (antes `rounded-lg` con
  azul-violeta).
- `.field` → fondo `--surface`, borde `--line`, texto `--ink`, anillo de foco en `--accent`.
- `.card` → fondo `--surface`, borde `--line`.
- Insignia/eyebrow → nueva clase para etiquetas tipo "TALLER"/"PASO 1".

## Decisiones resueltas (2026-08-26)

1. **Logos reales**: en curso — el usuario recorta cada uno con fondo transparente vía ChatGPT en
   Chrome, a partir de los recortes en alta resolución que dejé en `assets/logo-*.png` (extraídos
   y escalados de los 4 afiches). Estado al 2026-08-26:
   - **Integrados** en `public/logos/` y ya aplicados en el sitio: `beca-ser-andi.png` (header/nav
     y hero de `/`), `andi-seccional-antioquia.png` y `universidad-eafit.png` (footer
     institucional, `components/InstitutionalFooter.tsx`).
   - **Pendientes** (siguen como wordmark de texto en el footer mientras tanto): SER ANDI Fondo
     Social, NODO, Acción Impro, Servicio Público de Empleo, Comfama. Cuando el usuario entregue
     cada transparente, recortar el margen sobrante (`Image.getbbox()` + padding chico, como se
     hizo con los tres ya integrados) y guardarlo en `public/logos/` con nombre kebab-case.
2. **Nombre del sitio**: renombrado a **"Board SER ANDI"** (de "Board EAFIT-ANDI") — ver
   `CAPABILITY-MAP.md`. Aplicado en `app/layout.tsx` (title/description) y `app/page.tsx`.
3. **Tema oscuro**: confirmado, reemplaza la decisión anterior de "claro y limpio" tomada sin
   material de marca real. `color-scheme: dark` fijo, ya aplicado en `app/globals.css`.
