import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { getActiveCohortId, loginAs, TEST_PASSWORD, testPasswordHash, upsertTestUser, withDbRetry } from "./helpers";

const E2E_ADMIN = "e2e-talent-extras-admin@ejemplo.com";
const E2E_EMPLEABLE = "e2e-empleable-cv@ejemplo.com";
const E2E_FILTRO_ING = "e2e-filtro-ingenieria@ejemplo.com";
const E2E_FILTRO_COM = "e2e-filtro-comunicacion@ejemplo.com";
const E2E_FILTRO_SENIOR = "e2e-filtro-senior@ejemplo.com";
let cohortId: string;

test.beforeAll(async () => {
  await withDbRetry(async () => {
    const cohort = await prisma.cohort.findFirst({ where: { isActive: true } });
    if (!cohort) throw new Error("No hay cohorte activa — corre el seed primero.");
    cohortId = cohort.id;
    const passwordHash = await testPasswordHash();
    await prisma.user.upsert({
      where: { email: E2E_EMPLEABLE },
      update: { passwordHash },
      create: {
        email: E2E_EMPLEABLE,
        name: "Empleable CV E2E",
        role: "EMPLEABLE",
        cohortId,
        passwordHash,
      },
    });
  });

  await upsertTestUser({ email: E2E_ADMIN, name: "Admin E2E", role: "ADMIN", cohortId });

  const ing = await upsertTestUser({
    email: E2E_FILTRO_ING,
    name: "Filtro Ingeniería E2E",
    role: "EMPLEABLE",
    cohortId,
  });
  const com = await upsertTestUser({
    email: E2E_FILTRO_COM,
    name: "Filtro Comunicación E2E",
    role: "EMPLEABLE",
    cohortId,
  });
  const senior = await upsertTestUser({
    email: E2E_FILTRO_SENIOR,
    name: "Filtro Sénior E2E",
    role: "EMPLEABLE",
    cohortId,
  });

  await withDbRetry(() =>
    Promise.all([
      prisma.talentProfile.upsert({
        where: { ownerId: ing.id },
        update: {},
        create: {
          ownerId: ing.id,
          cohortId,
          headline: "Filtro Ingeniería",
          school: "Ingeniería",
          experienceYears: 4,
          experienceAreas: "Área de prueba",
          linkedinUrl: "https://linkedin.com/in/e2e-filtro-ing",
        },
      }),
      prisma.talentProfile.upsert({
        where: { ownerId: com.id },
        update: {},
        create: {
          ownerId: com.id,
          cohortId,
          headline: "Filtro Comunicación",
          school: "Comunicación",
          experienceYears: 3,
          experienceAreas: "Área de prueba",
          linkedinUrl: "https://linkedin.com/in/e2e-filtro-com",
        },
      }),
      prisma.talentProfile.upsert({
        where: { ownerId: senior.id },
        update: {},
        create: {
          ownerId: senior.id,
          cohortId,
          headline: "Filtro Sénior",
          school: "Ingeniería",
          experienceYears: 10,
          experienceAreas: "Área de prueba",
          linkedinUrl: "https://linkedin.com/in/e2e-filtro-senior",
        },
      }),
    ]),
  );
});

test.afterAll(async () => {
  await prisma.talentProfile.deleteMany({
    where: {
      owner: { email: { in: [E2E_EMPLEABLE, E2E_FILTRO_ING, E2E_FILTRO_COM, E2E_FILTRO_SENIOR] } },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: { in: [E2E_ADMIN, E2E_EMPLEABLE, E2E_FILTRO_ING, E2E_FILTRO_COM, E2E_FILTRO_SENIOR] },
    },
  });
  await prisma.$disconnect();
});

test("el filtro de /talento reduce la lista por escuela y por años de experiencia", async ({ page }) => {
  await loginAs(page, E2E_ADMIN, TEST_PASSWORD);

  await page.goto("/talento?school=Ingenier%C3%ADa");
  await expect(page.getByText("Filtro Ingeniería E2E")).toBeVisible();
  await expect(page.getByText("Filtro Comunicación E2E")).not.toBeVisible();

  await page.goto("/talento?minExperience=8");
  await expect(page.getByText("Filtro Sénior E2E")).toBeVisible();
  await expect(page.getByText("Filtro Ingeniería E2E")).not.toBeVisible();
});

test("un empleable sube, descarga y elimina su hoja de vida desde /perfil", async ({ page }) => {
  await loginAs(page, E2E_EMPLEABLE, TEST_PASSWORD);
  await page.goto("/perfil");

  await page.fill("#headline", "Perfil de prueba CV");
  await page.selectOption("#school", "Ingeniería");
  await page.fill("#experienceYears", "3");
  await page.fill("#experienceAreas", "Área de prueba");
  await page.fill("#linkedinUrl", "https://linkedin.com/in/e2e-cv");
  await page.setInputFiles("#cv", {
    name: "hoja-de-vida.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 contenido de prueba"),
  });
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByText("Guardado.")).toBeVisible({ timeout: 15_000 });
  const downloadLink = page.getByRole("link", { name: "hoja-de-vida.pdf" });
  await expect(downloadLink).toBeVisible();

  const cvUrl = await downloadLink.getAttribute("href");
  const response = await page.request.get(cvUrl!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");

  await page.getByRole("button", { name: "Eliminar hoja de vida" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: "hoja-de-vida.pdf" })).toHaveCount(0);

  const deletedResponse = await page.request.get(cvUrl!);
  expect(deletedResponse.status()).toBe(404);
});
