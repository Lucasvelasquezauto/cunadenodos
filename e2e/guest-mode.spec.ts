import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { loginAs, withDbRetry } from "./helpers";

test("el toggle de modo invitado controla el acceso a /invitado", async ({ page }) => {
  await loginAs(page, "admin@demo.board");

  // Estado inicial: apagado (default de seed).
  await page.goto("/invitado");
  await expect(page.getByText("No disponible")).toBeVisible();

  // Encender.
  await page.goto("/admin/settings");
  await page.check('input[name="guestModeEnabled"]');
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Activo", { exact: true })).toBeVisible();

  await page.goto("/invitado");
  await expect(page.getByRole("heading", { name: "Board SER ANDI — vista de invitado" })).toBeVisible();

  // Apagar de nuevo para no dejar el estado prendido entre corridas.
  await page.goto("/admin/settings");
  await page.uncheck('input[name="guestModeEnabled"]');
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Inactivo")).toBeVisible();

  await page.goto("/invitado");
  await expect(page.getByText("No disponible")).toBeVisible();
});

test.describe("con el modo invitado activo", () => {
  test.beforeAll(async () => {
    await withDbRetry(() =>
      prisma.appSettings.upsert({
        where: { id: 1 },
        update: { guestModeEnabled: true },
        create: { id: 1, guestModeEnabled: true },
      }),
    );
  });

  test.afterAll(async () => {
    await withDbRetry(() =>
      prisma.appSettings.update({ where: { id: 1 }, data: { guestModeEnabled: false } }),
    );
    await prisma.$disconnect();
  });

  test("empresas y talento se navegan sin sesión, resumidos", async ({ page }) => {
    const company = await prisma.company.findFirstOrThrow();
    const talent = await prisma.talentProfile.findFirstOrThrow({
      include: { owner: { select: { name: true } } },
    });

    await page.goto("/invitado/empresas");
    await expect(page.getByText(company.name)).toBeVisible();
    await page.goto(`/invitado/empresas/${company.id}`);
    await expect(page.getByRole("heading", { name: company.name })).toBeVisible();

    await page.goto("/invitado/talento");
    await expect(page.getByText(talent.owner.name ?? "")).toBeVisible();
    await page.goto(`/invitado/talento/${talent.id}`);
    await expect(page.getByRole("heading", { name: talent.owner.name ?? "" })).toBeVisible();
  });

  test("el estado laboral nunca se muestra, ni siquiera con employmentStatusVisible en true", async ({ page }) => {
    const visibleProfile = await prisma.talentProfile.findFirstOrThrow({
      where: { employmentStatusVisible: true, isEmployed: { not: null } },
    });

    await page.goto(`/invitado/talento/${visibleProfile.id}`);
    await expect(page.getByText("Estado", { exact: true })).not.toBeVisible();
  });

  test("sin botón de Contactar ni acciones de escritura", async ({ page }) => {
    const company = await prisma.company.findFirstOrThrow();
    const talent = await prisma.talentProfile.findFirstOrThrow();

    await page.goto(`/invitado/empresas/${company.id}`);
    await expect(page.getByRole("link", { name: "Contactar" })).toHaveCount(0);

    await page.goto(`/invitado/talento/${talent.id}`);
    await expect(page.getByRole("link", { name: "Contactar" })).toHaveCount(0);
  });
});
