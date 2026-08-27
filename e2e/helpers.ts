import type { Page } from "@playwright/test";

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

// El pooler gratuito de Supabase a veces responde con latencia alta bajo
// carga (ya lo vimos con timeouts intermitentes de conexión durante el
// desarrollo) — un solo intento de lectura justo después de escribir puede
// llegar antes de que el valor esté disponible. Reintenta con espera corta.
export async function getMagicLink(page: Page, email: string): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await page.request.get(
      `/api/test/last-link?email=${encodeURIComponent(email)}`,
      { headers: { "x-e2e-secret": process.env.E2E_TEST_SECRET ?? "" } },
    );
    const body = await res.json();
    if (body.link) return body.link as string;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No se generó ningún link para ${email}`);
}

export async function loginAs(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.click('button[type="submit"]');
  // El primer test del suite puede pegarle a un servidor de dev recién
  // levantado que todavía está compilando rutas por primera vez — timeout
  // generoso para no confundir ese costo de arranque con una falla real.
  await page.getByText("Revisa tu correo").waitFor({ timeout: 30_000 });
  const link = await getMagicLink(page, email);
  await page.goto(link);
}
