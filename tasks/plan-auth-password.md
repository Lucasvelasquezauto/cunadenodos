# Plan: Autenticación por contraseña

Ver `SPEC-auth-password.md` para el objetivo y el modelo de acceso. Este plan
define el orden de construcción y los riesgos.

## Orden de implementación (por dependencia)

1. **`prisma/schema.prisma`**
   - `User`: agrega `passwordHash String?`.
   - Nuevo modelo `PasswordResetToken { id, token @unique, userId, expiresAt, createdAt }`,
     relación con `User` (`onDelete: Cascade`).
   - Elimina `LastLinkCache` (ya no se usa).
   - Migración: `npx prisma migrate dev --name password_auth`.

2. **`lib/passwords.ts`** (nuevo)
   - `hashPassword`, `verifyPassword` (bcryptjs — sin bindings nativos, para no
     complicar el build serverless de Vercel).
   - `createPasswordResetToken(userId)`, `evaluateResetToken(record, now)` (función
     pura, mismo patrón que `evaluateInvitation` en `lib/invitations.ts`, para
     poder probarla sin DB), `validateResetToken(token)`, `consumeResetToken(token)`.

3. **`lib/auth.ts`**
   - Provider `Credentials` en vez de `Resend`: `authorize({ email, password })`
     busca el `User`, compara con `verifyPassword`, devuelve el user o `null`.
   - `session: { strategy: "jwt" }`.
   - Callback `jwt`: en el primer login mete `role`, `org`, `cohortId` al token.
     Callback `session`: los lee del token en vez del `user` de la DB.
   - Elimina el callback `signIn` (la puerta "correo debe existir" ya la impone
     `authorize` al no encontrar el user).
   - Elimina `getLastGeneratedLink`.

4. **Limpieza de infraestructura de magic link**
   - Borra `app/api/test/last-link/route.ts`.
   - Quita `E2E_TEST_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` de donde se lean
     (quedan fuera del `.env` también, pero eso lo dejo para que tú lo edites).
   - Quita la dependencia `resend` de `package.json` si no se usa en ningún
     otro lado (verificar con grep antes de tocar).

5. **`app/(auth)/login/page.tsx`**
   - Campo contraseña + `type="text"` en el de usuario/correo (ya no
     `type="email"`, porque "EAFIT" no pasa esa validación del navegador).
   - `signIn("credentials", { email, password, redirect: false })`, maneja
     error de credenciales inválidas con el mismo patrón de mensaje que ya
     existe para `AccessDenied`.
   - Se puede borrar `app/(auth)/verify-request/page.tsx` (ya no aplica).

6. **`app/invite/[token]/page.tsx` + `actions.ts`**
   - Agrega campos `password` / `confirmPassword` al formulario, junto a los
     dos checkboxes de consentimiento ya existentes.
   - `joinWithInvitation` valida que coincidan y cumplan un mínimo (8
     caracteres), hashea y guarda `passwordHash` al crear el `User`.

7. **`app/admin/users/`**
   - `createUser` (`actions.ts`) recibe `password` del formulario y la guarda
     hasheada.
   - `page.tsx`: el formulario "Nuevo usuario" gana el campo contraseña.
   - Reemplaza `generateAccessLink` (llamaba a Resend) por
     `generatePasswordResetLink(userId)`, que crea un `PasswordResetToken` y
     devuelve la URL `/reset-password/<token>`. El botón cambia de "Copiar
     link de acceso" a "Generar link para restablecer contraseña" — mismo
     componente `GenerateAndCopy`, no cambia esa pieza.

8. **`app/reset-password/[token]/{page,actions}.tsx`** (nuevo)
   - `page.tsx`: valida el token (existe, no vencido, no usado) con
     `validateResetToken`; si es válido muestra el formulario de nueva
     contraseña, si no, un mensaje de link inválido/vencido.
   - `actions.ts`: hashea, actualiza `passwordHash`, invalida el token
     (`consumeResetToken`), `redirect("/login")`.

9. **`types/next-auth.d.ts`**
   - Además de `Session`/`User`, augmentar `JWT` con `role`, `org`,
     `cohortId` (necesario para que el callback `jwt` tipe bien).

10. **`e2e/helpers.ts`**
    - `loginAs(page, email, password)`: `page.goto("/login")`, llena
      correo+contraseña, click, espera navegación a `/`. Se borra
      `getMagicLink` (ya no hay nada que consultar). Todos los call sites de
      `loginAs` en los specs existentes ganan el segundo argumento.

11. **`prisma/seed.ts`**
    - Cada usuario sembrado gana una contraseña de prueba fija (hasheada),
      para que los e2e sigan pudiendo loguearse.

12. **Tests unitarios**
    - `lib/passwords.test.ts`: hash/verify redondo, y `evaluateResetToken`
      (válido, vencido, no encontrado, ya usado) — mismo estilo que
      `lib/invitations.test.ts`.

## Riesgos

- **Sesión JWT en vez de DB**: si el admin cambia el rol de alguien mientras
  esa persona tiene sesión activa, el cambio no se refleja hasta que vuelva a
  entrar (el token no se relee de la DB en cada request). Aceptable para el
  piloto; lo dejo anotado como limitación conocida, no lo resuelvo ahora.
- **Migración de Prisma elimina `LastLinkCache`**: la tabla está vacía en
  producción (no hay usuarios reales todavía), así que no hay riesgo de
  pérdida de datos real.
- **`InvitationLink` no se toca**: sigue siendo el mecanismo de entrada para
  emprendedores/empleables tal cual está; el plan solo le agrega campos al
  formulario que ya existe en ese flujo, no cambia su lógica de validación.

## Verificación
- `npm run lint`, `npm run build` (confirma que el cambio de session strategy
  no rompe tipos).
- Suite completa: `npm test` (unit) y `npx playwright test` (e2e) en verde.
- Verificación manual en navegador: registro vía link de cohorte con
  contraseña, login con esa cuenta, creación de cuenta institución por admin,
  login con usuario simple, generación y uso de un link de reset.
