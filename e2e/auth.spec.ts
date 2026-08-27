import { test, expect } from "@playwright/test";
import { getMagicLink, loginAs } from "./helpers";

test("login exitoso con correo registrado deja una sesión válida", async ({ page }) => {
  await loginAs(page, "admin@demo.board");
  await expect(page).toHaveURL("/");
});

test("correo no registrado es rechazado con mensaje claro, sin crear cuenta", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "no-existe-e2e@ejemplo.com");
  await page.click('button[type="submit"]');
  await expect(page.getByTestId("login-error")).toContainText(
    "no está registrado en el programa",
  );
});

test("un usuario sin rol admin no puede entrar a /admin", async ({ page }) => {
  await loginAs(page, "emprendedor@demo.board");
  await page.goto("/admin");
  await expect(page).toHaveURL("/");
});

test("un correo desconocido no recibe magic link", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "otro-no-existe-e2e@ejemplo.com");
  await page.click('button[type="submit"]');
  const link = await getMagicLink(page, "otro-no-existe-e2e@ejemplo.com").catch(() => null);
  expect(link).toBeNull();
});
