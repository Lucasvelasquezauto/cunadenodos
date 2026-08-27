# Spec: messaging

Módulo del Capability Map (ver `CAPABILITY-MAP.md`). Depende de `identity`,
`directory-companies`, `directory-talent` — los tres ya construidos y verificados.

## ASSUMPTIONS I'M MAKING

1. El punto de entrada es exclusivamente el botón **"Contactar"** en `/empresas/[id]` y
   `/talento/[id]` — no hay un directorio separado de "personas para escribir"; se contacta desde
   el perfil que se está viendo.
2. **Confirmado por el usuario:** ni institución (EAFIT/ANDI) ni admin pueden ser contactados
   directamente. En v1 son siempre **iniciadores**, nunca receptores desde un perfil — no hace
   falta un punto de contacto tipo "Escribirle a institución".
3. **"Solicitud/aceptación"** = el primer mensaje de quien inicia queda en estado `PENDING`; la
   otra persona ve una solicitud de contacto con el mensaje y puede **Aceptar** (la conversación
   pasa a `ACCEPTED`, ambos escriben libremente) o **Rechazar** (`DECLINED`, se cierra, sin más
   mensajes). Mientras está `PENDING`, quien inició ve "esperando respuesta" y no puede mandar un
   segundo mensaje hasta que se acepte.
4. **Gate de completitud** (ya decidido en `CAPABILITY-MAP.md`: "sin muro de onboarding... lo que
   sí queda bloqueado es la acción de contactar"): un **emprendedor** con empresa incompleta
   (`isCompanyComplete` en `lib/companies.ts`) o un **empleable** con perfil incompleto
   (`isProfileComplete` en `lib/talent.ts`) ve el botón "Contactar" deshabilitado, con texto
   explicando qué falta y un link a su propia página de edición. Institución y Admin no tienen
   perfil que completar, así que el gate no les aplica — siempre pueden contactar.
5. Un mismo par de personas tiene **una sola conversación** (no hilos múltiples). Si alguien intenta
   contactar de nuevo a quien ya tiene una conversación con él, se le redirige a la existente en vez
   de crear una nueva.
6. Sin notificaciones por correo (ya está en "Fuera de alcance v1" del capability map — digest
   semanal). El único indicador es un contador de conversaciones con mensajes sin leer en el nav.
7. Nadie puede contactarse a sí mismo — el botón no aparece en la propia página (`/empresas/mia` y
   `/perfil` son las páginas de autoedición, no tienen botón "Contactar"; si alguien navegara a
   `/empresas/[id]` con su propio id, tampoco debe aparecer).

→ Corrígeme ahora o sigo con esto.

## Objective

Mensajería interna con modelo de solicitud/aceptación, bidireccional entre cualquier par de
cuentas del programa (emprendedor, empleable, institución, admin), reemplazando cualquier enlace
externo a WhatsApp/LinkedIn como canal de primer contacto — ese enlace sigue existiendo como campo
opcional en el perfil (`contactLink`), pero la conversación en sí vive dentro del board.

**Quién lo usa:**
- **Emprendedor / Empleable**: contactan a cualquier otro perfil del directorio (si su propio
  perfil/empresa está completo); reciben y responden solicitudes de contacto.
- **Institución**: inicia conversaciones desde cualquier perfil del directorio (ej. para recomendar
  a alguien) y responde las que reciba.
- **Admin**: mismo comportamiento que institución — puede navegar y contactar, sin restricciones
  adicionales de moderación en v1 (fuera de alcance: panel de moderación de mensajes).

**Éxito para este módulo:** dos cuentas ficticias pueden completar el ciclo completo
(solicitud → aceptar → intercambio de mensajes) de principio a fin, verificado en navegador y con
e2e; el gate de completitud bloquea el botón con una explicación clara en vez de solo
deshabilitarlo en silencio; nadie ve mensajes de una conversación de la que no es parte.

## Tech Stack, Commands, Code Style, Testing Strategy

Iguales a `SPEC-identity.md`. No se repiten aquí.

## Project Structure (nuevo)

```
prisma/schema.prisma          → + modelos Conversation, Message, + enum ConversationStatus
prisma/seed.ts                → + 3-4 conversaciones ficticias en distintos estados (pending,
                                 accepted con intercambio, declined) para que el demo se vea vivo
lib/messaging.ts               → findOrCreateConversation, canViewConversation, unreadCount,
                                 helpers de completitud reusados de lib/companies.ts / lib/talent.ts
app/mensajes/page.tsx          → inbox: lista de conversaciones propias, con badge de no leído
app/mensajes/[id]/page.tsx     → hilo completo: mensajes, caja de respuesta o Aceptar/Rechazar
                                 según status y rol del viewer
app/mensajes/[id]/actions.ts   → sendMessage, acceptConversation, declineConversation
app/mensajes/actions.ts        → startConversation (desde el botón "Contactar")
components/ContactButton.tsx   → botón reusado en /empresas/[id] y /talento/[id], con el estado
                                 deshabilitado + explicación cuando aplica el gate
```

## Modelo de datos

```prisma
enum ConversationStatus {
  PENDING
  ACCEPTED
  DECLINED
}

model Conversation {
  id          String             @id @default(cuid())
  initiatorId String
  initiator   User               @relation("ConversationsStarted", fields: [initiatorId], references: [id], onDelete: Cascade)
  recipientId String
  recipient   User               @relation("ConversationsReceived", fields: [recipientId], references: [id], onDelete: Cascade)
  status      ConversationStatus @default(PENDING)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  messages    Message[]

  @@unique([initiatorId, recipientId])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  body           String
  createdAt      DateTime     @default(now())
  readAt         DateTime?
}
```

`@@unique([initiatorId, recipientId])` evita duplicar una conversación en la misma dirección (doble
clic en "Contactar"). No cubre el caso simétrico (B contacta a A mientras ya existe A→B) — se
resuelve a nivel de aplicación en `findOrCreateConversation`, que busca en ambas direcciones antes
de crear una fila nueva. Con 100 personas en un grupo curado, la carrera real (dos personas
iniciando contacto mutuo en el mismo instante) es un caso borde aceptable para v1, no algo que
justifique una constraint compuesta más compleja.

## Boundaries

- **Always:** verificar en el server que el viewer es `initiatorId` o `recipientId` antes de
  mostrar una conversación o aceptar un mensaje — nunca confiar en el `id` de la URL solo;
  aplicar el gate de completitud (`isCompanyComplete`/`isProfileComplete`) solo a
  `EMPRENDEDOR`/`EMPLEABLE`, nunca a institución/admin.
- **Ask first:** cualquier canal de notificación por correo (fuera de alcance v1, ya documentado);
  edición o borrado de mensajes ya enviados; hilos grupales (más de 2 personas).
- **Never:** exponer el **contenido** de una conversación a alguien que no sea `initiatorId` o
  `recipientId` — confirmado por el usuario que esto incluye a admin, EAFIT y ANDI, sin excepción
  en v1 (ni con fines de moderación); permitir mandar mensajes en una conversación `DECLINED`;
  crear una segunda conversación entre el mismo par si ya existe una en cualquier estado.

## Success Criteria

- [x] `Conversation` y `Message` en el esquema, migración aplicada.
- [x] Seed crea 3-4 conversaciones ficticias en estados variados (pendiente, aceptada con varios
      mensajes, rechazada), entre cuentas ficticias ya existentes.
- [x] Botón "Contactar" en `/empresas/[id]` y `/talento/[id]`: ausente en el propio perfil,
      deshabilitado con explicación si el emprendedor/empleable que mira no completó su propio
      perfil/empresa, funcional en cualquier otro caso (incluida institución/admin sin gate) —
      verificado en navegador con una cuenta emprendedor sin empresa (bloqueada, con link a
      `/empresas/mia`) y con institución (sin gate).
- [x] Al enviar el primer mensaje se crea la conversación en `PENDING` y redirige a
      `/mensajes/[id]`; si ya existía una conversación con esa persona (en cualquier estado),
      redirige a la existente en vez de duplicar.
- [x] `/mensajes` lista las conversaciones propias (nombre de la otra persona, estado, último
      mensaje, indicador de no leído).
- [x] `/mensajes/[id]`: quien recibió una solicitud `PENDING` ve Aceptar/Rechazar; quien la envió ve
      "esperando respuesta"; en `ACCEPTED` ambos pueden escribir; en `DECLINED` la conversación se
      ve de solo lectura, sin caja de respuesta.
- [x] Verificado (navegador + e2e) que un tercero no puede abrir `/mensajes/[id]` de una
      conversación ajena — redirige o 404, sin exponer los mensajes ni en el HTML no renderizado.
      Probado explícitamente con admin, no solo con un usuario cualquiera.
- [x] `npm run test` y `npm run test:e2e` pasan en verde (25 unit, 16 e2e).

## Open Questions (resueltas 2026-08-26)

1. **Admin/institución y conversaciones ajenas**: confirmado — ni admin ni institución (EAFIT/ANDI)
   leen contenido, en ningún caso. Sí pueden ver **metadatos**: que una conversación existe y entre
   quiénes, sin el contenido de los mensajes. Esa vista de metadatos **no se construye en este
   módulo** — es exactamente lo que ya estaba descrito para `admin-dashboard` ("conexiones" en
   `CAPABILITY-MAP.md`), así que queda para ese módulo. `messaging` solo debe exponer lo necesario
   para que `admin-dashboard` pueda consultarlo después (ej. contar conversaciones y su estado vía
   Prisma directamente, sin pasar por una ruta de la app) — no se requiere ningún endpoint ni UI de
   metadatos dentro de `messaging` mismo.
2. **Institución/Admin como receptores**: confirmado, no son contactables directamente en v1 (ver
   Asunción 2 arriba).
3. **Formato del mensaje**: confirmado, texto plano únicamente, sin adjuntos ni formato.
