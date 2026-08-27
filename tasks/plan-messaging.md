# Plan: messaging

Fase 2 (Plan) sobre `SPEC-messaging.md` ya aprobado (las 3 preguntas abiertas quedaron resueltas
el 2026-08-26 — ver esa sección del spec).

## Refinamiento no explícito en el spec: flujo de "Contactar"

El spec deja `app/mensajes/actions.ts → startConversation` como una sola acción disparada desde el
botón, pero eso implica un botón que crea una conversación vacía sin mensaje — no calza con
"solicitud" (la otra persona necesita ver *por qué* la están contactando antes de Aceptar/Rechazar).
Se añade un paso intermedio, sin tocar el modelo de datos ni las Boundaries ya aprobadas:

- El botón **"Contactar"** es un `<Link>` (no una acción directa) a `app/mensajes/nueva/page.tsx`
  con el `id` del destinatario en la query (`?to=<userId>`).
- Esa página muestra a quién le vas a escribir, valida el gate de completitud y que no sea uno
  mismo, y tiene un textarea + "Enviar solicitud". El submit sí llama a `startConversation`
  (`app/mensajes/nueva/actions.ts`), que crea (o reusa, si ya existe) la conversación **y** el
  primer mensaje en una sola operación, y redirige a `/mensajes/[id]`.

## Componentes y orden de construcción

1. **Esquema Prisma**: `Conversation`, `Message`, enum `ConversationStatus`, + relaciones inversas
   en `User` (`conversationsStarted`, `conversationsReceived`, `messages`). Una sola migración.
2. **`lib/messaging.ts`**: `findOrCreateConversation(initiatorId, recipientId)` (busca en ambas
   direcciones antes de crear — ver spec), `canViewConversation(conversation, viewerId)`,
   `canContact(viewer, targetId)` (aplica el gate de completitud solo a
   EMPRENDEDOR/EMPLEABLE, reusando `isCompanyComplete`/`isProfileComplete`; institución/admin
   siempre `true`), `getUnreadCount(userId)`. Puros o casi puros donde se pueda, para tests unit.
3. **`components/ContactButton.tsx`**: recibe `targetUserId` y el resultado ya calculado de
   `canContact` (la página que lo usa decide si aplica, porque solo ella sabe si es el propio
   perfil); renderiza el link, el botón deshabilitado con explicación, o nada (propio perfil).
4. **`app/mensajes/nueva/page.tsx` + `actions.ts`**: página de composición del primer mensaje +
   `startConversation`. Depende de (1)-(2).
5. **`app/mensajes/page.tsx`**: inbox — conversaciones propias, nombre de la otra persona, estado,
   último mensaje, indicador de no leído. Depende de (1)-(2).
6. **`app/mensajes/[id]/page.tsx` + `actions.ts`**: hilo completo — `sendMessage`,
   `acceptConversation`, `declineConversation`, cada una verificando en servidor que el viewer es
   parte de la conversación antes de actuar. Depende de (1)-(2).
7. **Cablear `ContactButton`** en `/empresas/[id]` y `/talento/[id]` (ya existentes, de
   `directory-companies`/`directory-talent`) — cada página calcula `canContact` con los datos que
   ya carga (el `Company`/`TalentProfile` del viewer, si tiene). Depende de (3).
8. **`AppNav.tsx`**: agregar link "Mensajes" con badge de no leídos (`getUnreadCount`). Depende
   de (2).
9. **Seed**: 3-4 conversaciones ficticias en estados variados (pendiente, aceptada con 2-3
   mensajes de ida y vuelta, rechazada) entre cuentas ya sembradas. Depende de (1).
10. **Tests**: unit de `findOrCreateConversation` (dedup en ambas direcciones), `canViewConversation`,
    `canContact`; e2e del ciclo completo (contactar → solicitud pendiente → aceptar → intercambio),
    de rechazar (sin más mensajes posibles después), y de que un tercero no puede abrir
    `/mensajes/[id]` ajeno.

**Secuencial:** (1) → (2) → (3) → (4)/(5)/(6) en paralelo → (7)/(8) → (9) → (10).

## Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Confiar en el `id` de la URL en `/mensajes/[id]` sin verificar `initiatorId`/`recipientId` | Alto: expondría conversaciones ajenas — justo lo que el usuario acaba de prohibir explícitamente, incluso para admin/institución | `canViewConversation` se llama siempre en el server component antes de renderizar nada, mismo patrón que `directory-talent` con el estado laboral |
| Carrera simétrica en `findOrCreateConversation` (A y B se contactan mutuamente casi al mismo tiempo) | Bajo, ya documentado como aceptable en el spec | Buscar en ambas direcciones antes de crear; con 100 personas curadas el caso real es raro — no se justifica una constraint compuesta más compleja |
| El gate de completitud se aplica también a institución/admin por error (copiar-pegar del patrón de `directory-*`) | Medio: bloquearía a EAFIT/ANDI de contactar sin razón | `canContact` chequea el rol explícitamente antes de mirar completitud — cubierto por test unit |
| Inestabilidad intermitente del pooler de Supabase (ya vista en módulos anteriores) | Bajo-medio, ya mitigado | Mismo patrón de reintentos ya usado en los helpers de e2e |

## Checkpoints de verificación

- **A — Esquema listo:** migración aplicada; `Conversation` y `Message` visibles en la DB.
- **B — Gate correcto:** con una cuenta emprendedor/empleable de perfil incompleto, el botón
  "Contactar" aparece deshabilitado con explicación; con el perfil completo, funciona; con
  institución/admin, siempre funciona sin gate.
- **C — Ciclo completo:** dos cuentas de prueba completan solicitud → aceptar → intercambio de
  mensajes, verificado en navegador.
- **D — Rechazo:** una conversación `DECLINED` no admite más mensajes de ninguna de las dos partes.
- **E — Aislamiento:** una tercera cuenta no puede ver `/mensajes/[id]` de una conversación ajena
  (ni admin, ni institución) — verificado en navegador y e2e.
- **F — Cierre:** checklist de `SPEC-messaging.md` en verde + `npm run test` y `npm run test:e2e`
  pasan.

## Estimación de tiempo

~1.5 días — superficie similar a `directory-companies`/`directory-talent` (un modelo con relación
doble a `User`, tres páginas nuevas, un componente compartido), sobre patrones ya probados
(verificación de propiedad en servidor, Server Actions, seed extendido).
