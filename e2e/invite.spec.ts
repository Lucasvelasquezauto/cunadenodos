import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { withDbRetry } from "./helpers";

const TEST_EMAIL = "e2e-invite@ejemplo.com";
const TEST_EMAIL_NO_CONSENT = "e2e-invite-no-consent@ejemplo.com";
const TEST_EMAIL_BANNER = "e2e-invite-banner@ejemplo.com";
const TEST_PASSWORD = "InvitePass123!";
let validToken: string | undefined;
let expiredToken: string | undefined;

test.beforeAll(async () => {
  await withDbRetry(async () => {
    const cohort = await prisma.cohort.findFirst({ where: { isActive: true } });
    if (!cohort) throw new Error("No hay cohorte activa para el test — corre el seed primero.");

    const valid = await prisma.invitationLink.create({
      data: {
        token: `e2e-valid-${Date.now()}`,
        cohortId: cohort.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    validToken = valid.token;

    const expired = await prisma.invitationLink.create({
      data: {
        token: `e2e-expired-${Date.now()}`,
        cohortId: cohort.id,
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    expiredToken = expired.token;
  });
});

test.afterAll(async () => {
  const tokens = [validToken, expiredToken].filter((t): t is string => Boolean(t));
  if (tokens.length > 0) {
    await prisma.invitationLink.deleteMany({ where: { token: { in: tokens } } });
  }
  await prisma.user.deleteMany({
    where: { email: { in: [TEST_EMAIL, TEST_EMAIL_NO_CONSENT, TEST_EMAIL_BANNER] } },
  });
  await prisma.$disconnect();
});

test("un token de invitación vencido muestra un mensaje claro", async ({ page }) => {
  await page.goto(`/invite/${expiredToken}`);
  await expect(page.getByText("ya venció")).toBeVisible();
});

test("un token de invitación inexistente muestra un mensaje claro", async ({ page }) => {
  await page.goto("/invite/token-que-no-existe-e2e");
  await expect(page.getByText("no existe")).toBeVisible();
});

test("un token válido crea la cuenta con la ruta elegida, contraseña y consentimiento, y entra directo", async ({ page }) => {
  await page.goto(`/invite/${validToken}`);
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
  await page.check('input[name="track"][value="EMPLEABLE"]');
  await page.check('input[name="consentDataProcessing"]');
  await page.check('input[name="consentDirectory"]');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL("/", { timeout: 15_000 });

  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  expect(user?.role).toBe("EMPLEABLE");
  expect(user?.passwordHash).not.toBeNull();
  expect(user?.consentDataProcessingAt).not.toBeNull();
  expect(user?.consentDirectoryAt).not.toBeNull();
});

test("sin marcar los consentimientos, el servidor rechaza aunque se salte la validación del navegador", async ({ page }) => {
  await page.goto(`/invite/${validToken}`);
  await page.fill('input[name="email"]', TEST_EMAIL_NO_CONSENT);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
  await page.check('input[name="track"][value="EMPLEABLE"]');
  // Se salta la validación nativa del navegador a propósito, para probar que
  // el rechazo real está en el servidor (joinWithInvitation), no solo en el
  // atributo required del checkbox.
  await page.evaluate(() => {
    document
      .querySelectorAll('input[type="checkbox"]')
      .forEach((el) => el.removeAttribute("required"));
  });
  await page.click('button[type="submit"]');

  await expect(page.getByText("Debes aceptar los dos consentimientos")).toBeVisible();

  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL_NO_CONSENT } });
  expect(user).toBeNull();
});

test("el banner de perfil incompleto aparece hasta completar el perfil", async ({ page }) => {
  await page.goto(`/invite/${validToken}`);
  await page.fill('input[name="email"]', TEST_EMAIL_BANNER);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
  await page.check('input[name="track"][value="EMPLEABLE"]');
  await page.check('input[name="consentDataProcessing"]');
  await page.check('input[name="consentDirectory"]');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/", { timeout: 15_000 });

  await expect(page.getByText("Todavía no completas tu perfil")).toBeVisible();

  await page.goto("/perfil");
  await page.fill("#headline", "Perfil de prueba");
  await page.selectOption("#school", "Ingeniería");
  await page.fill("#experienceYears", "2");
  await page.fill("#experienceAreas", "Área de prueba");
  await page.fill("#linkedinUrl", "https://linkedin.com/in/e2e-invite-banner");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible({ timeout: 15_000 });

  await page.goto("/");
  await expect(page.getByText("Todavía no completas tu perfil")).not.toBeVisible();
});
