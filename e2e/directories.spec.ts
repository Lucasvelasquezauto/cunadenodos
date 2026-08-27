import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { loginAs, TEST_PASSWORD, testPasswordHash, withDbRetry } from "./helpers";

const E2E_EMPRENDEDOR = "e2e-empresa@ejemplo.com";
let cohortId: string;

test.beforeAll(async () => {
  await withDbRetry(async () => {
    const cohort = await prisma.cohort.findFirst({ where: { isActive: true } });
    if (!cohort) throw new Error("No hay cohorte activa — corre el seed primero.");
    cohortId = cohort.id;
    const passwordHash = await testPasswordHash();
    await prisma.user.upsert({
      where: { email: E2E_EMPRENDEDOR },
      update: { passwordHash },
      create: {
        email: E2E_EMPRENDEDOR,
        name: "Emprendedor E2E",
        role: "EMPRENDEDOR",
        cohortId,
        passwordHash,
      },
    });
  });
});

test.afterAll(async () => {
  await prisma.company.deleteMany({
    where: { owner: { email: E2E_EMPRENDEDOR } },
  });
  await prisma.user.deleteMany({ where: { email: E2E_EMPRENDEDOR } });
  await prisma.$disconnect();
});

test("empresas y talento son navegables con cualquier cuenta con sesión", async ({ page }) => {
  await loginAs(page, "admin@demo.board", TEST_PASSWORD);

  await page.goto("/empresas");
  await expect(page.getByText("Café Sereno")).toBeVisible();

  await page.goto("/talento");
  await expect(page.getByText("Carlos Ruiz")).toBeVisible();
});

test("sin sesión, /empresas redirige a /login", async ({ page }) => {
  await page.goto("/empresas");
  await expect(page).toHaveURL("/login");
});

test("el estado laboral oculto no se muestra a un tercero, pero sí a admin", async ({ page }) => {
  const hiddenProfile = await prisma.talentProfile.findFirst({
    where: { employmentStatusVisible: false },
  });
  if (!hiddenProfile) throw new Error("No hay perfil de seed con employmentStatusVisible=false.");

  await loginAs(page, "empleable@demo.board", TEST_PASSWORD);
  await page.goto(`/talento/${hiddenProfile.id}`);
  await expect(page.getByText("Estado", { exact: true })).not.toBeVisible();

  await loginAs(page, "admin@demo.board", TEST_PASSWORD);
  await page.goto(`/talento/${hiddenProfile.id}`);
  await expect(page.getByText("Estado", { exact: true })).toBeVisible();
});

test("un emprendedor sin empresa la crea desde /empresas/mia, y solo edita la propia", async ({ page }) => {
  // Dos logins + varias cargas de (app)/layout.tsx (que ahora también
  // consulta ProfileReminderBanner en cada una, ver SPEC-onboarding.md) —
  // bajo la latencia intermitente del pooler de Supabase, el timeout global
  // de 45s se queda corto para este flujo.
  test.setTimeout(90_000);

  await loginAs(page, E2E_EMPRENDEDOR, TEST_PASSWORD);
  await page.goto("/empresas/mia");

  await page.fill("#name", "Empresa E2E");
  await page.fill("#tagline", "Creada por la prueba automatizada");
  await page.fill("#description", "Descripción de prueba para el flujo de autoedición.");
  await page.fill("#valueProp", "Propuesta de valor de prueba.");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByText("Guardado.")).toBeVisible({ timeout: 15_000 });

  const saved = await prisma.company.findUnique({
    where: { ownerId: (await prisma.user.findUniqueOrThrow({ where: { email: E2E_EMPRENDEDOR } })).id },
  });
  expect(saved?.name).toBe("Empresa E2E");

  // Otro emprendedor real (del seed) no ve ni edita esta empresa desde su propio /empresas/mia.
  await loginAs(page, "emprendedor@demo.board", TEST_PASSWORD);
  await page.goto("/empresas/mia");
  const nameField = page.locator("#name");
  await expect(nameField).not.toHaveValue("Empresa E2E");
});

test("un rol distinto de emprendedor no puede entrar a /empresas/mia", async ({ page }) => {
  await loginAs(page, "empleable@demo.board", TEST_PASSWORD);
  await page.goto("/empresas/mia");
  await expect(page).toHaveURL("/");
});
