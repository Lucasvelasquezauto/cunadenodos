import type { Page } from "@playwright/test";
import { hashPassword } from "../lib/passwords";

// Contraseña única para todas las cuentas creadas dentro de los tests e2e
// (seed y las creadas ad-hoc en cada spec) — no hay nada secreto que
// proteger aquí, solo necesita ser la misma en todos lados.
export const TEST_PASSWORD = "TestPass123!";

export async function testPasswordHash(): Promise<string> {
  return hashPassword(TEST_PASSWORD);
}

// El pooler gratuito de Supabase falla de forma intermitente bajo carga (lo
// vimos varias veces durante el desarrollo). Reintenta cualquier llamada a
// Prisma unas cuantas veces antes de dar por real la falla.
export async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // El primer test del suite puede pegarle a un servidor de dev recién
  // levantado que todavía está compilando rutas por primera vez — timeout
  // generoso para no confundir ese costo de arranque con una falla real.
  await page.waitForURL("/", { timeout: 30_000 });
}
