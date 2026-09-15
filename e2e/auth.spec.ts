import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { getActiveCohortId, loginAs, TEST_PASSWORD, upsertTestUser } from "./helpers";

const E2E_ADMIN = "e2e-auth-admin@ejemplo.com";
const E2E_EMPRENDEDOR = "e2e-auth-emprendedor@ejemplo.com";

test.beforeAll(async () => {
  const cohortId = await getActiveCohortId();
  await upsertTestUser({ email: E2E_ADMIN, name: "Admin E2E", role: "ADMIN", cohortId });
  await upsertTestUser({
    email: E2E_EMPRENDEDOR,
    name: "Emprendedor E2E",
    role: "EMPRENDEDOR",
    cohortId,
  });
});

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [E2E_ADMIN, E2E_EMPRENDEDOR] } } });
  await prisma.$disconnect();
});

test("login exitoso con correo registrado deja una sesión válida", async ({ page }) => {
  await loginAs(page, E2E_ADMIN, TEST_PASSWORD);
  await expect(page).toHaveURL("/");
});

test("correo no registrado es rechazado con mensaje claro, sin crear cuenta", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "no-existe-e2e@ejemplo.com");
  await page.fill('input[name="password"]', "cualquier-cosa");
  await page.click('button[type="submit"]');
  await expect(page.getByTestId("login-error")).toContainText("Usuario o contraseña incorrectos");
});

test("un usuario sin rol admin no puede entrar a /admin", async ({ page }) => {
  await loginAs(page, E2E_EMPRENDEDOR, TEST_PASSWORD);
  await page.goto("/admin");
  await expect(page).toHaveURL("/");
});

test("una contraseña incorrecta para un correo real es rechazada", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E_ADMIN);
  await page.fill('input[name="password"]', "contraseña-incorrecta");
  await page.click('button[type="submit"]');
  await expect(page.getByTestId("login-error")).toContainText("Usuario o contraseña incorrectos");
  await expect(page).toHaveURL(/\/login/);
});

test("cualquier usuario logueado puede cambiar su propia contraseña desde la barra de navegación", async ({
  page,
}) => {
  const NEW_PASSWORD = "MiNuevaClave123!";
  await loginAs(page, E2E_EMPRENDEDOR, TEST_PASSWORD);

  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  const dialog = page.locator("dialog");
  await expect(dialog).toBeVisible();

  const linkInput = dialog.locator("input[readonly]");
  await expect(linkInput).toBeVisible({ timeout: 10_000 });
  const resetLink = await linkInput.inputValue();
  expect(resetLink).toContain("/reset-password/");

  await dialog.getByRole("button", { name: "Cerrar" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/");

  await page.goto(resetLink);
  await page.fill('input[name="password"]', NEW_PASSWORD);
  await page.fill('input[name="confirmPassword"]', NEW_PASSWORD);
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page).toHaveURL("/login");

  await loginAs(page, E2E_EMPRENDEDOR, NEW_PASSWORD);
  await expect(page).toHaveURL("/");
});
