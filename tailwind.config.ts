import type { Config } from "tailwindcss";

// Paleta real del programa "Beca SER ANDI" (ver DESIGN.md), extraída de 4
// afiches oficiales — negro + dorado, no la paleta azul-violeta provisional
// del primer borrador. Todos los valores en OKLCH, verificados contra WCAG AA.
const config: Config = {
  darkMode: undefined, // tema fijo (oscuro), no depende del sistema
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "oklch(0.09 0 0)",
        ink: "oklch(0.98 0 0)",
        muted: "oklch(0.75 0.01 90)",
        surface: "oklch(0.14 0.006 90)",
        ring: "oklch(0.87 0.17 95)",

        primary: {
          DEFAULT: "oklch(0.87 0.17 95)",
          hover: "oklch(0.80 0.17 95)",
          soft: "oklch(0.22 0.05 95)",
        },
        accent: {
          DEFAULT: "oklch(0.75 0.15 95)",
          hover: "oklch(0.68 0.15 95)",
          soft: "oklch(0.20 0.045 95)",
        },
        success: {
          DEFAULT: "oklch(0.75 0.16 145)",
          soft: "oklch(0.20 0.06 145)",
        },
        warning: {
          DEFAULT: "oklch(0.80 0.15 70)",
          soft: "oklch(0.20 0.055 70)",
        },
        error: {
          DEFAULT: "oklch(0.72 0.19 25)",
          soft: "oklch(0.22 0.07 25)",
        },

        // Escala neutra reusada por el código existente (text-gray-600,
        // border-gray-300, etc.) — reordenada para tema oscuro: números
        // bajos = tonos cercanos al fondo (paneles, bordes sutiles),
        // números altos = mayor énfasis de texto (blanco/casi blanco).
        gray: {
          50: "oklch(0.20 0.008 90)",
          100: "oklch(0.18 0.008 90)",
          200: "oklch(0.26 0.012 90)",
          300: "oklch(0.34 0.012 90)",
          400: "oklch(0.52 0.01 90)",
          500: "oklch(0.62 0.01 90)",
          600: "oklch(0.75 0.01 90)",
          700: "oklch(0.82 0.01 90)",
          800: "oklch(0.90 0.005 90)",
          900: "oklch(0.98 0 0)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.4" }],
        sm: ["0.9375rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.1875rem", { lineHeight: "1.5" }],
        xl: ["1.375rem", { lineHeight: "1.4" }],
        "2xl": ["1.625rem", { lineHeight: "1.3" }],
        "3xl": ["1.9375rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
      },
    },
  },
  plugins: [],
};
export default config;
