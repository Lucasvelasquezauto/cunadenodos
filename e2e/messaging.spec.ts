import { test, expect } from "@playwright/test";
import { prisma } from "../lib/db";
import { loginAs, TEST_PASSWORD, testPasswordHash, withDbRetry } from "./helpers";

const E2E_SENDER = "e2e-msg-sender@ejemplo.com";
const E2E_RECEIVER = "e2e-msg-receiver@ejemplo.com";
const E2E_DECLINER = "e2e-msg-decliner@ejemplo.com";
// Par aparte, solo para la prueba de aislamiento — así no choca con el
// @@unique([initiatorId, recipientId]) de las conversaciones que ya crean
// las otras dos pruebas entre SENDER/RECEIVER y DECLINER/RECEIVER.
const E2E_ISOLATION_A = "e2e-msg-isolation-a@ejemplo.com";
const E2E_ISOLATION_B = "e2e-msg-isolation-b@ejemplo.com";

test.beforeAll(async () => {
  await withDbRetry(async () => {
    const cohort = await prisma.cohort.findFirst({ where: { isActive: true } });
    if (!cohort) throw new Error("No hay cohorte activa — corre el seed primero.");
    const cohortId = cohort.id;
    const passwordHash = await testPasswordHash();

    const sender = await prisma.user.upsert({
      where: { email: E2E_SENDER },
      update: { passwordHash },
      create: {
        email: E2E_SENDER,
        name: "Emprendedor Mensajería E2E",
        role: "EMPRENDEDOR",
        cohortId,
        passwordHash,
      },
    });
    await prisma.company.upsert({
      where: { ownerId: sender.id },
      update: {},
      create: {
        ownerId: sender.id,
        cohortId,
        name: "Empresa Mensajería E2E",
        tagline: "Tagline de prueba",
        description: "Descripción de prueba para el flujo de mensajería.",
        valueProp: "Propuesta de valor de prueba.",
        founders: [],
      },
    });

    const decliner = await prisma.user.upsert({
      where: { email: E2E_DECLINER },
      update: { passwordHash },
      create: {
        email: E2E_DECLINER,
        name: "Emprendedor Rechazo E2E",
        role: "EMPRENDEDOR",
        cohortId,
        passwordHash,
      },
    });
    await prisma.company.upsert({
      where: { ownerId: decliner.id },
      update: {},
      create: {
        ownerId: decliner.id,
        cohortId,
        name: "Empresa Rechazo E2E",
        tagline: "Tagline de prueba",
        description: "Descripción de prueba para el flujo de rechazo.",
        valueProp: "Propuesta de valor de prueba.",
        founders: [],
      },
    });

    const receiver = await prisma.user.upsert({
      where: { email: E2E_RECEIVER },
      update: { passwordHash },
      create: {
        email: E2E_RECEIVER,
        name: "Empleable Mensajería E2E",
        role: "EMPLEABLE",
        cohortId,
        passwordHash,
      },
    });
    await prisma.talentProfile.upsert({
      where: { ownerId: receiver.id },
      update: {},
      create: {
        ownerId: receiver.id,
        cohortId,
        headline: "Perfil de prueba",
        experienceAreas: "Área de prueba",
        linkedinUrl: "https://linkedin.com/in/e2e-msg-receiver",
      },
    });

    // Sin company/perfil — el par de aislamiento nunca pasa por el gate de
    // completitud, la conversación se crea directo por Prisma en el test.
    await prisma.user.upsert({
      where: { email: E2E_ISOLATION_A },
      update: {},
      create: { email: E2E_ISOLATION_A, name: "Aislamiento A E2E", role: "EMPLEABLE", cohortId },
    });
    await prisma.user.upsert({
      where: { email: E2E_ISOLATION_B },
      update: {},
      create: { email: E2E_ISOLATION_B, name: "Aislamiento B E2E", role: "EMPLEABLE", cohortId },
    });
  });
});

test.afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      email: { in: [E2E_SENDER, E2E_RECEIVER, E2E_DECLINER, E2E_ISOLATION_A, E2E_ISOLATION_B] },
    },
  });
  await prisma.$disconnect();
});

test("ciclo completo: contactar, solicitud pendiente, aceptar, intercambio de mensajes", async ({ page }) => {
  // Dos logins por magic link + varias escrituras en DB en la misma prueba —
  // bajo la latencia intermitente del pooler de Supabase (ya documentada en
  // otros módulos), el timeout global de 45s se queda corto para este flujo.
  test.setTimeout(90_000);

  const receiverId = (await prisma.user.findUniqueOrThrow({ where: { email: E2E_RECEIVER } })).id;

  await loginAs(page, E2E_SENDER, TEST_PASSWORD);
  await page.goto(`/mensajes/nueva?to=${receiverId}`);
  await page.fill("#body", "Hola, quiero contactarte para un proyecto.");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  // El redirect depende de crear la conversación y el primer mensaje en DB —
  // bajo la latencia intermitente del pooler de Supabase ya vista en otros
  // módulos, puede tardar más que el timeout por defecto de Playwright.
  await page.waitForURL(/\/mensajes\/[a-z0-9]+$/, { timeout: 20_000 });
  await expect(page.getByText("Esperando respuesta")).toBeVisible({ timeout: 20_000 });
  const conversationUrl = page.url();

  await loginAs(page, E2E_RECEIVER, TEST_PASSWORD);
  await page.goto(conversationUrl);
  await expect(page.getByText("¿Aceptas la solicitud?")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Aceptar" }).click();

  await page.fill("#body", "¡Hola! Sí, hablemos.");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("¡Hola! Sí, hablemos.")).toBeVisible({ timeout: 20_000 });

  const conversation = await prisma.conversation.findFirst({
    where: { initiator: { email: E2E_SENDER }, recipient: { email: E2E_RECEIVER } },
    include: { messages: true },
  });
  expect(conversation?.status).toBe("ACCEPTED");
  expect(conversation?.messages.length).toBe(2);
});

test("una conversación rechazada no admite más mensajes", async ({ page }) => {
  // Mismo motivo que la prueba anterior: dos logins + varias escrituras en
  // la misma prueba se quedan cortos con el timeout global de 45s bajo la
  // latencia actual del pooler de Supabase.
  test.setTimeout(90_000);

  const receiverId = (await prisma.user.findUniqueOrThrow({ where: { email: E2E_RECEIVER } })).id;

  await loginAs(page, E2E_DECLINER, TEST_PASSWORD);
  await page.goto(`/mensajes/nueva?to=${receiverId}`);
  await page.fill("#body", "Hola, ¿te interesaría un proyecto con nosotros?");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await page.waitForURL(/\/mensajes\/[a-z0-9]+$/, { timeout: 20_000 });
  const conversationUrl = page.url();

  await loginAs(page, E2E_RECEIVER, TEST_PASSWORD);
  await page.goto(conversationUrl);
  await page.getByRole("button", { name: "Rechazar" }).click();

  await expect(page.getByText("Esta conversación fue rechazada.")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("textarea#body")).toHaveCount(0);

  const conversation = await prisma.conversation.findFirst({
    where: { initiator: { email: E2E_DECLINER }, recipient: { email: E2E_RECEIVER } },
  });
  expect(conversation?.status).toBe("DECLINED");
});

test("un tercero (incluido admin) no puede abrir la conversación de otros", async ({ page }) => {
  const [userA, userB] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: E2E_ISOLATION_A } }),
    prisma.user.findUniqueOrThrow({ where: { email: E2E_ISOLATION_B } }),
  ]);
  const secretBody = "Mensaje secreto que admin no debería poder leer.";
  const conversation = await prisma.conversation.create({
    data: {
      initiatorId: userA.id,
      recipientId: userB.id,
      status: "ACCEPTED",
      messages: { create: { senderId: userA.id, body: secretBody } },
    },
  });

  await loginAs(page, "admin@demo.board", TEST_PASSWORD);
  await page.goto(`/mensajes/${conversation.id}`);

  await expect(page.getByText(secretBody)).not.toBeVisible();
});
