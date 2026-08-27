# Spec: Autenticación por contraseña (reemplaza magic link)

## Objetivo
Reemplazar el login por "magic link" (Auth.js + Resend) por login tradicional de
correo/usuario + contraseña, porque Resend no puede entregar correo a nadie fuera
de la cuenta del dueño (plan gratis, sin dominio verificado, y verificar uno a
tiempo para la prueba con EAFIT no es viable). El nuevo modelo no depende de que
llegue ningún correo, en ningún punto del flujo.

## Modelo de acceso por rol

- **Emprendedor / Empleable** (~100 personas): entran la primera vez únicamente
  con el link de invitación por cohorte que ya existe (`/invite/[token]`). En ese
  mismo formulario, además de los dos checkboxes de consentimiento, ponen su
  contraseña. De ahí en adelante entran con correo + contraseña, sin nada más.
- **Institución (EAFIT / ANDI)**: un solo login compartido por institución,
  creado directamente por el admin, sin pasar por ningún link. El "usuario" es
  literalmente `EAFIT` / `ANDI` (no hace falta que sea un correo real) y la
  contraseña la define el admin al crear la cuenta.
- **Admin**: igual que institución — cuenta creada directamente con contraseña
  puesta por quien la crea.
- **Olvidó su contraseña (cualquier rol)**: el admin, desde `/admin/users`,
  genera un link de "restablecer contraseña" de un solo uso y se lo reenvía por
  el canal que sea (WhatsApp, etc.). Ese link deja poner una contraseña nueva y
  se invalida al usarse.

## Cambios técnicos

- **Prisma**: agregar `passwordHash` a `User`. Nuevo modelo
  `PasswordResetToken { id, token, userId, expiresAt, createdAt }` — sirve tanto
  para "primera contraseña" (institución/admin) como para "olvidé mi
  contraseña" (cualquiera); es el mismo mecanismo de un solo uso en ambos casos.
- **Auth.js**: cambia el provider de `Resend` a `Credentials`, y la estrategia
  de sesión de `database` a `jwt` (requisito de Auth.js para Credentials). Rol,
  organización y cohortId se mueven del callback `session` a un callback `jwt`.
- **Se elimina** (deja de tener sentido): provider Resend, `LastLinkCache` y
  `getLastGeneratedLink`, `/api/test/last-link`, `E2E_TEST_SECRET`,
  `RESEND_API_KEY`, `EMAIL_FROM`. Menos variables de entorno, menos superficie.
- **`/login`**: formulario de correo/usuario + contraseña (el campo deja de ser
  `type="email"` estricto, porque "EAFIT" no es un correo válido).
- **`/invite/[token]`**: se agregan campos de contraseña + confirmación.
- **`/admin/users`**: el formulario "Nuevo usuario" incluye contraseña. El botón
  "Copiar link de acceso" pasa a ser "Generar link para restablecer contraseña".
- **Nueva ruta `/reset-password/[token]`**: valida el token, deja poner
  contraseña nueva, la guarda con hash (bcrypt), invalida el token, redirige a
  `/login`.
- **e2e**: `loginAs` deja de seguir un link generado — hace login directo con
  correo + contraseña. Se simplifica bastante. `prisma/seed.ts` gana contraseñas
  para los usuarios sembrados.

## Fuera de alcance
- Recuperación de contraseña 100% autoservicio (seguirá siendo el admin quien
  reenvía el link de reset manualmente — no hay envío de correo automático).
- Requisitos de complejidad de contraseña más allá de un mínimo razonable
  (se define en Plan).

## Criterios de éxito
- Nadie necesita que llegue un correo, en ningún punto del sistema.
- Emprendedor/empleable se registra solo (vía link de cohorte) y vuelve a
  entrar solo, indefinidamente, con su correo + contraseña.
- Institución y admin entran con usuario simple + contraseña puesta por el
  admin al crearlos, sin ningún link de por medio.
- Admin puede generar y reenviar un link de reset para cualquier cuenta.
- Suite de tests (unit + e2e) actualizada y en verde con el nuevo flujo.

## Preguntas abiertas
- Ninguna bloqueante — la contraseña de institución/admin la define quien crea
  la cuenta directamente en el formulario, no es un valor fijo en el código.
