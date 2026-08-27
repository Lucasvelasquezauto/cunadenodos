import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { loginAs, TEST_PASSWORD, withDbRetry } from "./helpers";
import { hashPassword } from "../lib/passwords";

const INSTITUTION_USERNAME = "E2E-INSTITUCION-TEST";
const INSTITUTION_PASSWORD = "InstPass123!";
const RESET_TARGET_EMAIL = "e2e-reset-target@ejemplo.com";
const OLD_PASSWORD = "OldPass123!";
const NEW_PASSWORD = "NewPass123!";

let cohortId: string;

test.beforeAll(async () => {
  await withDbRetry(async () => {
    const cohort = await prisma.cohort.findFirst({ where: { isActive: true } });
    if (!cohort) throw new Error("No hay cohorte activa — corre el seed primero.");
    cohortId = cohort.id;

    const passwordHash = await hashPassword(OLD_PASSWORD);
    await prisma.user.upsert({
      where: { email: RESET_TARGET_EMAIL },
      update: { passwordHash },
      create: {
        email: RESET_TARGET_EMAIL,
        name: "Reset Target E2E",
        role: "EMPLEABLE",
        cohortId,
        passwordHash,
      },
    });
  });
});

test.afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [INSTITUTION_USERNAME, RESET_TARGET_EMAIL] } },
  });
  await prisma.$disconnect();
});

test("el admin crea una cuenta institución con usuario simple y esa cuenta entra sin link", async ({ page }) => {
  await loginAs(page, "admin@demo.board", TEST_PASSWORD);
  await page.goto("/admin/users");

  await page.fill('input[name="email"]', INSTITUTION_USERNAME);
  await page.fill('input[name="password"]', INSTITUTION_PASSWORD);
  await page.selectOption('select[name="role"]', "INSTITUCION");
  await page.selectOption('select[name="org"]', "EAFIT");
  await page.selectOption('select[name="cohortId"]', cohortId);
  await page.getByRole("button", { name: "Crear usuario" }).click();

  await expect(page.getByText(INSTITUTION_USERNAME)).toBeVisible({ timeout: 15_000 });

  await loginAs(page, INSTITUTION_USERNAME, INSTITUTION_PASSWORD);
  await expect(page).toHaveURL("/");
});

test("el admin genera un link de reset, la persona pone contraseña nueva, y el link no sirve dos veces", async ({ page }) => {
  await loginAs(page, "admin@demo.board", TEST_PASSWORD);
  await page.goto("/admin/users");

  const row = page.locator("li", { hasText: RESET_TARGET_EMAIL });
  await row.getByRole("button", { name: "Generar link para restablecer contraseña" }).click();

  const linkInput = row.locator("input[readonly]");
  await expect(linkInput).toBeVisible({ timeout: 10_000 });
  const resetLink = await linkInput.inputValue();
  expect(resetLink).toContain("/reset-password/");

  await page.goto(resetLink);
  await page.fill('input[name="password"]', NEW_PASSWORD);
  await page.fill('input[name="confirmPassword"]', NEW_PASSWORD);
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page).toHaveURL("/login");

  await loginAs(page, RESET_TARGET_EMAIL, NEW_PASSWORD);
  await expect(page).toHaveURL("/");

  // El mismo link ya no debe servir para cambiarla otra vez.
  await page.goto(resetLink);
  await expect(page.getByText("Link no válido")).toBeVisible();
});
