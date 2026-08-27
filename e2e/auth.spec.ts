import { test, expect } from "@playwright/test";
import { loginAs, TEST_PASSWORD } from "./helpers";

test("login exitoso con correo registrado deja una sesión válida", async ({ page }) => {
  await loginAs(page, "admin@demo.board", TEST_PASSWORD);
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
  await loginAs(page, "emprendedor@demo.board", TEST_PASSWORD);
  await page.goto("/admin");
  await expect(page).toHaveURL("/");
});

test("una contraseña incorrecta para un correo real es rechazada", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@demo.board");
  await page.fill('input[name="password"]', "contraseña-incorrecta");
  await page.click('button[type="submit"]');
  await expect(page.getByTestId("login-error")).toContainText("Usuario o contraseña incorrectos");
  await expect(page).toHaveURL(/\/login/);
});
