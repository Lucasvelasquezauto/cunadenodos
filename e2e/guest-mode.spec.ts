import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { getActiveCohortId, loginAs, TEST_PASSWORD, upsertTestUser, withDbRetry } from "./helpers";

const E2E_ADMIN = "e2e-guest-admin@ejemplo.com";
let cohortId: string;

// AppSettings id=1 es la fila real de producción (el toggle que ven los
// visitantes de verdad) — todo este archivo la manipula para probar el
// flujo, así que se captura una sola vez al inicio y se restaura completa
// (incluyendo el rastro de auditoría, no solo el booleano) al final, para no
// dejar un correo de prueba como "último cambio" en el panel del admin.
let originalSettings: Awaited<ReturnType<typeof prisma.appSettings.findUnique>>;

test.beforeAll(async () => {
  cohortId = await getActiveCohortId();
  await upsertTestUser({ email: E2E_ADMIN, name: "Admin E2E", role: "ADMIN", cohortId });
  originalSettings = await withDbRetry(() => prisma.appSettings.findUnique({ where: { id: 1 } }));
});

test.afterAll(async () => {
  await withDbRetry(() =>
    prisma.appSettings.upsert({
      where: { id: 1 },
      update: {
        guestModeEnabled: originalSettings?.guestModeEnabled ?? false,
        guestModeChangedBy: originalSettings?.guestModeChangedBy ?? null,
        guestModeChangedAt: originalSettings?.guestModeChangedAt ?? null,
      },
      create: { id: 1, guestModeEnabled: false },
    }),
  );
  await prisma.user.deleteMany({ where: { email: E2E_ADMIN } });
  await prisma.$disconnect();
});

test("el toggle de modo invitado controla el acceso a /invitado", async ({ page }) => {
  // Dos idas y vueltas a /admin/settings dentro de una suite larga — bajo la
  // latencia intermitente del pooler de Supabase (ya documentada en otros
  // módulos), el timeout por defecto de 5s se queda corto justo después de
  // que el server action escribe en DB y revalida la página.
  test.setTimeout(90_000);

  await loginAs(page, E2E_ADMIN, TEST_PASSWORD);

  // Forzar apagado explícitamente en vez de asumir el estado inicial real.
  await page.goto("/admin/settings");
  if (await page.locator('input[name="guestModeEnabled"]').isChecked()) {
    await page.uncheck('input[name="guestModeEnabled"]');
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Inactivo")).toBeVisible({ timeout: 15_000 });
  }
  await page.goto("/invitado");
  await expect(page.getByText("No disponible")).toBeVisible({ timeout: 15_000 });

  // Encender.
  await page.goto("/admin/settings");
  await page.check('input[name="guestModeEnabled"]');
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Activo", { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.goto("/invitado");
  await expect(page.getByRole("heading", { name: "Cuna de Nodos — vista de invitado" })).toBeVisible({
    timeout: 15_000,
  });

  // Apagar de nuevo.
  await page.goto("/admin/settings");
  await page.uncheck('input[name="guestModeEnabled"]');
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Inactivo")).toBeVisible({ timeout: 15_000 });

  await page.goto("/invitado");
  await expect(page.getByText("No disponible")).toBeVisible({ timeout: 15_000 });
});

test.describe("con el modo invitado activo", () => {
  const E2E_EMPRESA_OWNER = "e2e-guest-empresa@ejemplo.com";
  const E2E_TALENTO_OWNER = "e2e-guest-talento@ejemplo.com";
  const COMPANY_NAME = "Empresa E2E Invitado";
  const TALENT_NAME = "Talento E2E Invitado";
  let companyId: string;
  let talentId: string;

  test.beforeAll(async () => {
    await withDbRetry(() =>
      prisma.appSettings.upsert({
        where: { id: 1 },
        update: { guestModeEnabled: true },
        create: { id: 1, guestModeEnabled: true },
      }),
    );

    const companyOwner = await upsertTestUser({
      email: E2E_EMPRESA_OWNER,
      name: COMPANY_NAME,
      role: "EMPRENDEDOR",
      cohortId,
    });
    const company = await withDbRetry(() =>
      prisma.company.upsert({
        where: { ownerId: companyOwner.id },
        update: {},
        create: {
          ownerId: companyOwner.id,
          cohortId,
          name: COMPANY_NAME,
          tagline: "Tagline de prueba",
          description: "Descripción de prueba para el modo invitado.",
          valueProp: "Propuesta de valor de prueba.",
          founders: [{ name: "Fundador E2E", bio: "Bio de prueba" }],
        },
      }),
    );
    companyId = company.id;

    const talentOwner = await upsertTestUser({
      email: E2E_TALENTO_OWNER,
      name: TALENT_NAME,
      role: "EMPLEABLE",
      cohortId,
    });
    const talent = await withDbRetry(() =>
      prisma.talentProfile.upsert({
        where: { ownerId: talentOwner.id },
        update: {},
        create: {
          ownerId: talentOwner.id,
          cohortId,
          headline: "Perfil E2E invitado",
          school: "Ingeniería",
          experienceYears: 5,
          experienceAreas: "Área de prueba",
          linkedinUrl: "https://linkedin.com/in/e2e-guest-talento",
          isEmployed: true,
          isSeekingWork: true,
          employmentStatusVisible: true,
        },
      }),
    );
    talentId = talent.id;
  });

  test.afterAll(async () => {
    await withDbRetry(() =>
      prisma.appSettings.update({ where: { id: 1 }, data: { guestModeEnabled: false } }),
    );
    await prisma.talentProfile.deleteMany({ where: { owner: { email: E2E_TALENTO_OWNER } } });
    await prisma.company.deleteMany({ where: { owner: { email: E2E_EMPRESA_OWNER } } });
    await prisma.user.deleteMany({ where: { email: { in: [E2E_EMPRESA_OWNER, E2E_TALENTO_OWNER] } } });
    await prisma.$disconnect();
  });

  test("empresas y talento se navegan sin sesión, resumidos", async ({ page }) => {
    await page.goto("/invitado/empresas");
    await expect(page.getByText(COMPANY_NAME)).toBeVisible();
    await page.goto(`/invitado/empresas/${companyId}`);
    await expect(page.getByRole("heading", { name: COMPANY_NAME })).toBeVisible();

    await page.goto("/invitado/talento");
    await expect(page.getByText(TALENT_NAME)).toBeVisible();
    await page.goto(`/invitado/talento/${talentId}`);
    await expect(page.getByRole("heading", { name: TALENT_NAME })).toBeVisible();
  });

  test("el estado laboral nunca se muestra, ni siquiera con employmentStatusVisible en true", async ({ page }) => {
    await page.goto(`/invitado/talento/${talentId}`);
    await expect(page.getByText("Estado", { exact: true })).not.toBeVisible();
  });

  test("sin botón de Contactar ni acciones de escritura", async ({ page }) => {
    await page.goto(`/invitado/empresas/${companyId}`);
    await expect(page.getByRole("link", { name: "Contactar" })).toHaveCount(0);

    await page.goto(`/invitado/talento/${talentId}`);
    await expect(page.getByRole("link", { name: "Contactar" })).toHaveCount(0);
  });
});
