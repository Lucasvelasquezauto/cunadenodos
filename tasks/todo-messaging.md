# Tasks: messaging

Fase 3, sobre `tasks/plan-messaging.md` aprobado. Orden = orden de ejecución.

- [x] **T1 — Esquema Prisma: Conversation + Message**
  - Acceptance: `Conversation` (con `ConversationStatus` `PENDING`/`ACCEPTED`/`DECLINED`,
    `@@unique([initiatorId, recipientId])`) y `Message`, con relaciones inversas en `User`
    (`conversationsStarted`, `conversationsReceived`, `messages`), `onDelete: Cascade`; migración
    aplicada.
  - Verify: `npx prisma migrate dev` corre limpio; `npx prisma studio` muestra las tablas.
  - Files: `prisma/schema.prisma`

- [x] **T2 — `lib/messaging.ts`**
  - Acceptance: `findOrCreateConversation(initiatorId, recipientId)` busca en ambas direcciones
    antes de crear; `canViewConversation(conversation, viewerId)`; `canContact(viewer, targetId)`
    aplica el gate de completitud solo a `EMPRENDEDOR`/`EMPLEABLE` (institución/admin siempre
    `true`); `getUnreadCount(userId)`.
  - Verify: cubierto por tests unit (T10).
  - Files: `lib/messaging.ts`

- [x] **T3 — `components/ContactButton.tsx`**
  - Acceptance: recibe `targetUserId` + el resultado ya calculado de `canContact` desde la página
    que lo usa; renderiza link a `/mensajes/nueva?to=...`, botón deshabilitado con explicación, o
    nada si es el propio perfil.
  - Verify: manual, junto con T7.
  - Files: `components/ContactButton.tsx`

- [x] **T4 — `/mensajes/nueva` (composición) + `actions.ts`**
  - Acceptance: muestra a quién se le escribe; valida gate de completitud y que no sea uno mismo
    antes de renderizar el formulario; el submit (`startConversation`) crea o reusa la
    conversación y el primer mensaje en una sola operación, y redirige a `/mensajes/[id]`.
  - Verify: manual — contactar a alguien nuevo crea conversación `PENDING`; contactar de nuevo a
    quien ya tiene conversación redirige a la existente sin duplicar.
  - Files: `app/(app)/mensajes/nueva/page.tsx`, `app/(app)/mensajes/nueva/actions.ts`

- [x] **T5 — `/mensajes` (inbox)**
  - Acceptance: lista las conversaciones propias (nombre de la otra persona, estado, último
    mensaje, indicador de no leído); accesible con cualquier rol con sesión.
  - Verify: manual con distintas cuentas de prueba.
  - Files: `app/(app)/mensajes/page.tsx`

- [x] **T6 — `/mensajes/[id]` (hilo) + `actions.ts`**
  - Acceptance: `canViewConversation` se verifica en el server component antes de renderizar
    cualquier dato; quien recibió una solicitud `PENDING` ve Aceptar/Rechazar, quien la envió ve
    "esperando respuesta"; en `ACCEPTED` ambos escriben; en `DECLINED` es de solo lectura, sin
    caja de respuesta ni forma de mandar mensajes nuevos.
  - Verify: manual — ciclo completo (solicitud → aceptar → intercambio) y ciclo de rechazo, con
    dos cuentas de prueba.
  - Files: `app/(app)/mensajes/[id]/page.tsx`, `app/(app)/mensajes/[id]/actions.ts`

- [x] **T7 — Cablear `ContactButton` en los directorios**
  - Acceptance: `/empresas/[id]` y `/talento/[id]` calculan `canContact` con los datos que ya
    cargan (el `Company`/`TalentProfile` del viewer, si tiene) y pasan el resultado al botón;
    ausente en el propio perfil.
  - Verify: manual — perfil incompleto ve el botón deshabilitado con explicación; perfil completo
    o institución/admin lo ven funcional.
  - Files: `app/(app)/empresas/[id]/page.tsx`, `app/(app)/talento/[id]/page.tsx`

- [x] **T8 — `AppNav`: link "Mensajes" + badge de no leídos**
  - Acceptance: nuevo link visible para cualquier rol con sesión; badge numérico solo si hay
    conversaciones con mensajes sin leer.
  - Verify: manual — mandar un mensaje de prueba y confirmar que el badge aparece del lado del
    receptor y desaparece al abrir la conversación.
  - Files: `components/AppNav.tsx`

- [x] **T9 — Seed: conversaciones ficticias**
  - Acceptance: 3-4 conversaciones entre cuentas ya sembradas, en estados variados (pendiente,
    aceptada con 2-3 mensajes de ida y vuelta, rechazada).
  - Verify: revisión manual del contenido antes de seguir.
  - Files: `prisma/seed.ts`

- [x] **T10 — Tests unit**
  - Acceptance: cobertura de `findOrCreateConversation` (dedup en ambas direcciones),
    `canViewConversation`, y `canContact` (incluido el caso institución/admin sin gate).
  - Verify: `npm run test` en verde.
  - Files: `tests/messaging.test.ts`

- [x] **T11 — Tests e2e**
  - Acceptance: ciclo completo (contactar → solicitud pendiente → aceptar → intercambio de
    mensajes) de principio a fin; una conversación `DECLINED` no admite más mensajes; una tercera
    cuenta (incluida admin) no puede abrir `/mensajes/[id]` de una conversación ajena.
  - Verify: `npm run test:e2e` en verde.
  - Files: `e2e/messaging.spec.ts`

- [x] **T12 — Checklist final contra Success Criteria**
  - Acceptance: cada ítem de "Success Criteria" en `SPEC-messaging.md` verificado.
  - Verify: recorrido manual + `npm run test` y `npm run test:e2e` en verde a la vez.
  - Files: `SPEC-messaging.md`, `tasks/todo-messaging.md`
