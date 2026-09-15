import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { getActiveCohortId, loginAs, TEST_PASSWORD, upsertTestUser, withDbRetry } from "./helpers";

const E2E_ADMIN = "e2e-dir-admin@ejemplo.com";
const E2E_EMPRENDEDOR = "e2e-empresa@ejemplo.com";
const E2E_EMPRENDEDOR_LISTADO = "e2e-dir-emprendedor-listado@ejemplo.com";
const E2E_EMPRENDEDOR_2 = "e2e-dir-emprendedor2@ejemplo.com";
const E2E_EMPLEABLE = "e2e-dir-empleable@ejemplo.com";
const E2E_EMPLEABLE_HIDDEN = "e2e-dir-empleable-hidden@ejemplo.com";
let cohortId: string;

test.beforeAll(async () => {
  cohortId = await getActiveCohortId();
  await upsertTestUser({ email: E2E_ADMIN, name: "Admin E2E", role: "ADMIN", cohortId });
  await upsertTestUser({
    email: E2E_EMPRENDEDOR,
    name: "Emprendedor E2E",
    role: "EMPRENDEDOR",
    cohortId,
  });
  const emprendedorListado = await upsertTestUser({
    email: E2E_EMPRENDEDOR_LISTADO,
    name: "Emprendedor Listado E2E",
    role: "EMPRENDEDOR",
    cohortId,
  });
  await withDbRetry(() =>
    prisma.company.upsert({
      where: { ownerId: emprendedorListado.id },
      update: {},
      create: {
        ownerId: emprendedorListado.id,
        cohortId,
        name: "Empresa Listada E2E",
        tagline: "Tagline de prueba",
        description: "Descripción de prueba para el listado de empresas.",
        valueProp: "Propuesta de valor de prueba.",
        founders: [],
      },
    }),
  );
  await upsertTestUser({
    email: E2E_EMPRENDEDOR_2,
    name: "Emprendedor Dos E2E",
    role: "EMPRENDEDOR",
    cohortId,
  });
  const empleable = await upsertTestUser({
    email: E2E_EMPLEABLE,
    name: "Empleable E2E",
    role: "EMPLEABLE",
    cohortId,
  });
  await withDbRetry(() =>
    prisma.talentProfile.upsert({
      where: { ownerId: empleable.id },
      update: {},
      create: {
        ownerId: empleable.id,
        cohortId,
        headline: "Perfil E2E navegable",
        school: "Ingeniería",
        experienceYears: 2,
        experienceAreas: "Área de prueba",
        linkedinUrl: "https://linkedin.com/in/e2e-dir-empleable",
      },
    }),
  );

  const empleableHidden = await upsertTestUser({
    email: E2E_EMPLEABLE_HIDDEN,
    name: "Empleable Oculto E2E",
    role: "EMPLEABLE",
    cohortId,
  });
  await withDbRetry(() =>
    prisma.talentProfile.upsert({
      where: { ownerId: empleableHidden.id },
      update: {},
      create: {
        ownerId: empleableHidden.id,
        cohortId,
        headline: "Perfil E2E con estado oculto",
        school: "Ingeniería",
        experienceYears: 2,
        experienceAreas: "Área de prueba",
        linkedinUrl: "https://linkedin.com/in/e2e-dir-empleable-hidden",
        isEmployed: true,
        isSeekingWork: false,
        employmentStatusVisible: false,
      },
    }),
  );
});

test.afterAll(async () => {
  await prisma.talentProfile.deleteMany({
    where: { owner: { email: { in: [E2E_EMPLEABLE, E2E_EMPLEABLE_HIDDEN] } } },
  });
  await prisma.company.deleteMany({
    where: { owner: { email: { in: [E2E_EMPRENDEDOR, E2E_EMPRENDEDOR_LISTADO] } } },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          E2E_ADMIN,
          E2E_EMPRENDEDOR,
          E2E_EMPRENDEDOR_LISTADO,
          E2E_EMPRENDEDOR_2,
          E2E_EMPLEABLE,
          E2E_EMPLEABLE_HIDDEN,
        ],
      },
    },
  });
  await prisma.$disconnect();
});

test("empresas y talento son navegables con cualquier cuenta con sesión", async ({ page }) => {
  await loginAs(page, E2E_ADMIN, TEST_PASSWORD);

  await page.goto("/empresas");
  await expect(page.getByText("Empresa Listada E2E")).toBeVisible();

  await page.goto("/talento");
  await expect(page.getByText("Empleable E2E")).toBeVisible();
});

test("sin sesión, /empresas redirige a /login", async ({ page }) => {
  await page.goto("/empresas");
  await expect(page).toHaveURL("/login");
});

test("el estado laboral oculto no se muestra a un tercero, pero sí a admin", async ({ page }) => {
  const hiddenProfile = await prisma.talentProfile.findFirstOrThrow({
    where: { owner: { email: E2E_EMPLEABLE_HIDDEN } },
  });

  await loginAs(page, E2E_EMPLEABLE, TEST_PASSWORD);
  await page.goto(`/talento/${hiddenProfile.id}`);
  await expect(page.getByText("Estado", { exact: true })).not.toBeVisible();

  await loginAs(page, E2E_ADMIN, TEST_PASSWORD);
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

  // Otro emprendedor no ve ni edita esta empresa desde su propio /empresas/mia.
  await loginAs(page, E2E_EMPRENDEDOR_2, TEST_PASSWORD);
  await page.goto("/empresas/mia");
  const nameField = page.locator("#name");
  await expect(nameField).not.toHaveValue("Empresa E2E");
});

test("un rol distinto de emprendedor no puede entrar a /empresas/mia", async ({ page }) => {
  await loginAs(page, E2E_EMPLEABLE, TEST_PASSWORD);
  await page.goto("/empresas/mia");
  await expect(page).toHaveURL("/");
});
