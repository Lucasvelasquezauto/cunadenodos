import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { getActiveCohortId, loginAs, TEST_PASSWORD, upsertTestUser, withDbRetry } from "./helpers";
import { isCompanyComplete } from "../lib/companies";
import { isProfileComplete } from "../lib/talent";

const E2E_ADMIN = "e2e-metricas-admin@ejemplo.com";
const E2E_EAFIT = "e2e-metricas-eafit@ejemplo.com";
const E2E_EMPRENDEDOR = "e2e-metricas-emprendedor@ejemplo.com";
const E2E_EMPLEABLE = "e2e-metricas-empleable@ejemplo.com";

let cohortId: string;

test.beforeAll(async () => {
  cohortId = await getActiveCohortId();
  await upsertTestUser({ email: E2E_ADMIN, name: "Admin E2E", role: "ADMIN", cohortId });
  await upsertTestUser({
    email: E2E_EAFIT,
    name: "EAFIT E2E",
    role: "INSTITUCION",
    org: "EAFIT",
    cohortId,
  });
  await upsertTestUser({
    email: E2E_EMPRENDEDOR,
    name: "Emprendedor E2E",
    role: "EMPRENDEDOR",
    cohortId,
  });
  await upsertTestUser({
    email: E2E_EMPLEABLE,
    name: "Empleable E2E",
    role: "EMPLEABLE",
    cohortId,
  });
});

test.afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [E2E_ADMIN, E2E_EAFIT, E2E_EMPRENDEDOR, E2E_EMPLEABLE] } },
  });
  await prisma.$disconnect();
});

test("admin e institución pueden entrar a /metricas; emprendedor y empleable no", async ({ page }) => {
  // Cuatro logins en una sola prueba — bajo la latencia intermitente del
  // pooler de Supabase (ya documentada en otros módulos), el timeout global
  // de 45s se queda corto.
  test.setTimeout(90_000);

  await loginAs(page, E2E_ADMIN, TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page.getByRole("heading", { name: "Completitud de datos" })).toBeVisible();

  await loginAs(page, E2E_EAFIT, TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page.getByRole("heading", { name: "Completitud de datos" })).toBeVisible();

  await loginAs(page, E2E_EMPRENDEDOR, TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page).toHaveURL("/");

  await loginAs(page, E2E_EMPLEABLE, TEST_PASSWORD);
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

  await loginAs(page, E2E_ADMIN, TEST_PASSWORD);
  await page.goto("/metricas");
  await expect(page.getByText(expectedCompanies, { exact: true })).toBeVisible();
  await expect(page.getByText(expectedProfiles, { exact: true })).toBeVisible();
});

test("la lista de conexiones no expone el contenido de ningún mensaje", async ({ page }) => {
  // Par propio en lugar de un mensaje cualquiera de la tabla — no hay
  // garantía de que exista alguno cuando este archivo corre solo.
  const secretBody = "Mensaje secreto E2E metricas — no debería verse en /metricas.";
  const initiator = await upsertTestUser({
    email: "e2e-metricas-msg-a@ejemplo.com",
    name: "Conexión A E2E",
    role: "EMPLEABLE",
    cohortId,
  });
  const recipient = await upsertTestUser({
    email: "e2e-metricas-msg-b@ejemplo.com",
    name: "Conexión B E2E",
    role: "EMPLEABLE",
    cohortId,
  });
  await withDbRetry(() =>
    prisma.conversation.upsert({
      where: { initiatorId_recipientId: { initiatorId: initiator.id, recipientId: recipient.id } },
      update: {},
      create: {
        initiatorId: initiator.id,
        recipientId: recipient.id,
        status: "ACCEPTED",
        messages: { create: { senderId: initiator.id, body: secretBody } },
      },
    }),
  );

  try {
    await loginAs(page, E2E_EAFIT, TEST_PASSWORD);
    await page.goto("/metricas");

    await expect(page.getByRole("heading", { name: "Conexiones" })).toBeVisible();
    await expect(page.getByText(secretBody)).not.toBeVisible();
  } finally {
    await prisma.user.deleteMany({
      where: { email: { in: ["e2e-metricas-msg-a@ejemplo.com", "e2e-metricas-msg-b@ejemplo.com"] } },
    });
  }
});
