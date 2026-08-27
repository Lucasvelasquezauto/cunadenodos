import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { loginAs, TEST_PASSWORD, withDbRetry } from "./helpers";
import { isCompanyComplete } from "../lib/companies";
import { isProfileComplete } from "../lib/talent";

test("admin e institución pueden entrar a /metricas; emprendedor y empleable no", async ({ page }) => {
  // Cuatro logins por magic link en una sola prueba — bajo la latencia
  // intermitente del pooler de Supabase (ya documentada en otros módulos),
  // el timeout global de 45s se queda corto.
  test.setTimeout(90_000);

  await loginAs(page, "admin@demo.board", TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page.getByRole("heading", { name: "Completitud de datos" })).toBeVisible();

  await loginAs(page, "eafit@demo.board", TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page.getByRole("heading", { name: "Completitud de datos" })).toBeVisible();

  await loginAs(page, "emprendedor@demo.board", TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page).toHaveURL("/");

  await loginAs(page, "empleable@demo.board", TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page).toHaveURL("/");
});

test("los conteos de completitud coinciden con los datos reales", async ({ page }) => {
  const [companies, profiles] = await withDbRetry(() =>
    Promise.all([
      prisma.company.findMany({
        select: { name: true, tagline: true, description: true, valueProp: true },
      }),
      prisma.talentProfile.findMany({
        select: { headline: true, experienceAreas: true, linkedinUrl: true },
      }),
    ]),
  );
  const expectedCompanies = `${companies.filter(isCompanyComplete).length}/${companies.length}`;
  const expectedProfiles = `${profiles.filter(isProfileComplete).length}/${profiles.length}`;

  await loginAs(page, "admin@demo.board", TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page.getByText(expectedCompanies, { exact: true })).toBeVisible();
  await expect(page.getByText(expectedProfiles, { exact: true })).toBeVisible();
});

test("la lista de conexiones no expone el contenido de ningún mensaje", async ({ page }) => {
  const message = await withDbRetry(() => prisma.message.findFirstOrThrow());

  await loginAs(page, "eafit@demo.board", TEST_PASSWORD);
  await page.goto("/metricas");

  await expect(page.getByRole("heading", { name: "Conexiones" })).toBeVisible();
  await expect(page.getByText(message.body)).not.toBeVisible();
});
