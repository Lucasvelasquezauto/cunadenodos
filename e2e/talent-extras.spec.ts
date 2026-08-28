import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { loginAs, TEST_PASSWORD, testPasswordHash, withDbRetry } from "./helpers";

const E2E_EMPLEABLE = "e2e-empleable-cv@ejemplo.com";
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
});

test.afterAll(async () => {
  await prisma.talentProfile.deleteMany({ where: { owner: { email: E2E_EMPLEABLE } } });
  await prisma.user.deleteMany({ where: { email: E2E_EMPLEABLE } });
  await prisma.$disconnect();
});

test("el filtro de /talento reduce la lista por escuela y por años de experiencia", async ({ page }) => {
  await loginAs(page, "admin@demo.board", TEST_PASSWORD);

  await page.goto("/talento?school=Ingenier%C3%ADa");
  await expect(page.getByText("Carlos Ruiz")).toBeVisible();
  await expect(page.getByText("Valentina Correa")).not.toBeVisible();

  await page.goto("/talento?minExperience=8");
  await expect(page.getByText("Paula Andrea Restrepo")).toBeVisible();
  await expect(page.getByText("Carlos Ruiz")).not.toBeVisible();
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
