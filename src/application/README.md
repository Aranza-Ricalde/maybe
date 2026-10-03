# application/

Casos de uso que orquestan `domain/` + los repositorios de `infrastructure/`.

## Implementado

**`RecordTransactionUseCase`** (`recordTransaction.ts`) — el único lugar permitido para insertar una fila en `transactions`. El formulario web, el import de CSV y el webhook de Telegram los tres lo van a llamar en vez de escribir directo a la base. En una sola transacción de Postgres (vía `LedgerUnitOfWork`, implementado con Drizzle en `infrastructure/db/ledger.ts`):
1. Valida el input (monto entero distinto de 0, fecha válida, cuenta activa).
2. Si viene de `csv_import`, busca duplicados ya capturados a mano/Telegram (mismo monto, ±3 días) y lanza `DuplicateTransactionError` en vez de insertar silenciosamente — es `ReconcileImportUseCase` integrado aquí mismo, no un caso de uso separado.
3. Inserta la transacción.
4. Actualiza `account_balances_daily` (propagando el delta a cualquier snapshot posterior ya guardado, para que los movimientos retroactivos no dejen saldos futuros desactualizados).
5. Si el `kind` no es un transfer entre cuentas propias (`transfer` / `loan_payment` / `cc_payment`), actualiza `category_monthly_totals` y `income_expense_monthly`.

Validado contra la base real de Neon en `scripts/smoke-test-ledger.ts` (`pnpm test:smoke`) — crea datos de prueba, corre los 4 escenarios (egreso simple, egreso retroactivo, duplicado de import, transfer excluido de agregados), y limpia todo al final.

**Nota de infraestructura:** el driver `neon-http` no soporta transacciones reales (`BEGIN`/`COMMIT`) — por eso `infrastructure/db/client.ts` usa `neon-serverless` (`Pool` sobre websocket), no el `neon()` de HTTP.

**`DetectRecurringItemsUseCase`** (`detectRecurringItems.ts`) — corre la heurística de `domain/recurring/rules.ts` (mismo patrón merchant/nombre + cuenta, monto y día del mes estables, en ≥3 meses distintos de los últimos 6) sobre el historial de una family y crea un `recurring_candidate` por patrón nuevo. Nunca crea un `recurring_item` directo — eso lo decide el usuario al aceptar la sugerencia. Nunca repite una sugerencia ya hecha (`hasExistingCandidate` revisa cualquier estado, no solo pending).

Validado en `scripts/smoke-test-recurring.ts` — siembra 4 meses de un cargo recurrente + una compra única de ruido, confirma que detecta solo el recurrente con el monto promedio y la categoría correctos, y que correrlo dos veces no duplica el candidato.

**`ProjectCashflowUseCase`** (`projectCashflow.ts`) — "a este ritmo te quedan $X para fin de mes". Combina, a una fecha dada:
- saldo actual (último snapshot de `account_balances_daily` por cuenta, sumado),
- recurrentes activos cuyo día del mes todavía no llegó (los que ya pasaron se asumen reflejados en el saldo real),
- `scheduled_transactions` en estado "planned" dentro de la ventana restante del mes,
- un gasto variable proyectado = promedio de los últimos 3 meses de `income_expense_monthly` **menos** la parte ya contada como recurrente (para no contar Netflix dos veces), prorrateado a los días que quedan.

Es una aproximación declarada, no un pronóstico exacto — la lógica vive en `domain/cashflow/rules.ts::computeCashflowProjection`, pura y testeable sin DB. Validado en `scripts/smoke-test-cashflow.ts` con una fecha de referencia fija (no la fecha real del sistema, para poder calcular el resultado esperado a mano) — los 4 números de salida coincidieron exactamente con el cálculo manual.

**Autenticación** (`bootstrapFamily.ts`, `login.ts`, `logout.ts`, `validateSession.ts`) — esta app es de un solo hogar, no un SaaS multi-tenant, así que no hay "sign up" público:
- **`BootstrapFamilyUseCase`** crea la ÚNICA family + primer usuario, una sola vez al desplegar. Se rechaza (`FamilyAlreadyExistsError`) si ya existe una family — así un `/bootstrap` expuesto por accidente no deja que cualquiera cree una cuenta.
- **`LoginUseCase`** verifica credenciales (mismo error genérico si el email no existe o la contraseña es incorrecta, para no filtrar qué emails están registrados) y crea una sesión de 30 días.
- **`ValidateSessionUseCase`** es el chequeo REAL de sesión, usado por `app/lib/dal.ts` en cada página/Server Action — devuelve el usuario o `null` si el token no existe, es inválido, o ya expiró (y en ese caso borra la sesión vencida). `proxy.ts` (antes "middleware", renombrado en Next 16) solo hace el chequeo optimista de si existe la cookie, sin tocar la base.
- **`LogoutUseCase`** borra la sesión.

La base **nunca guarda el token de sesión crudo**, solo su hash SHA-256 (`infrastructure/auth/sessionTokens.ts`) — igual que la contraseña, que se guarda con scrypt (`infrastructure/auth/passwordHasher.ts`, vía `node:crypto`, sin agregar bcrypt/argon2 como dependencia nueva). Se agregó la tabla `sessions` al esquema (no existía en el plan original) y ya está aplicada en Neon (25 tablas).

Validado en `scripts/smoke-test-auth.ts`: bootstrap exitoso, segundo bootstrap rechazado, login con contraseña incorrecta rechazado, login correcto, sesión válida resuelve al usuario, token inventado devuelve null, logout invalida la sesión — las 7 pasaron. También validado con peticiones HTTP reales contra `pnpm dev` (`curl` con cookie jar): login/logout/proxy/DAL funcionando juntos de punta a punta.

**`ImportCsvUseCase`** (`importCsv.ts`) — importa un CSV fila por fila, SIEMPRE a través de `RecordTransactionUseCase` (nunca un INSERT directo), así hereda gratis la detección de duplicados contra lo capturado a mano/Telegram. Un error en una fila no aborta el import completo — se reporta en `summary.errors` y sigue con las demás. El parser de CSV (`domain/csvImport/rules.ts::parseCsv`) es RFC4180-ish, escrito a mano (sin agregar una librería nueva): soporta comillas con comas y comillas escapadas dentro. El mapeo de columnas se identifica por un "bank signature" (los encabezados del CSV) y se recuerda en `import_mappings` — la primera vez que aparece un formato de banco hay que mapearlo explícitamente (si no, `MissingColumnMappingError`), las siguientes veces se recuerda solo.

Nota de alcance: el monto del CSV debe venir ya en la convención ledger del propio banco (positivo ingreso, negativo egreso) — no se adivina el signo. Y la detección de duplicados solo compara contra `manual`/`telegram`, no contra otro `csv_import` previo — si re-importas el mismo archivo dos veces, se duplica (es la limitación conocida; el caso real que se cubre es "ya lo registré a mano, no lo dupliques al importar el estado de cuenta").

Validado en `scripts/smoke-test-csv-import.ts`: parseo con comillas, 1 fila duplicada contra un movimiento manual, 1 fila con monto inválido que no aborta el import, el `import` queda en estado `completed`, el mapeo se recuerda para un import posterior del mismo banco, y un banco nunca visto pide mapeo en vez de adivinar — las 4 validaciones pasaron.

**`CleanMerchantNameUseCase`** (`cleanMerchantName.ts`) — Gemini limpia el nombre del comercio (ej. "SP *UBER *TRIP 883219 MEXICO CITY MX" → "UBER") solo la primera vez que ve un patrón de descripción nuevo; `domain/merchants/rules.ts::normalizeMerchantPattern` quita los números (folios de transacción) antes de usar la descripción como llave de caché en `merchant_patterns`, así que dos compras del mismo comercio con folio distinto no generan dos llamadas a la API. Implementado contra la REST API de Gemini directo con `fetch` (`infrastructure/gemini/merchantNameCleaner.ts`), sin agregar el SDK de Google como dependencia — modelo `gemini-flash-lite-latest` (el alias "latest" en vez de fijar una versión, para no quedar pegado a un modelo que Google deprecate).

Validado en `scripts/smoke-test-merchant-cleaning.ts` contra la **Gemini API real** (no un mock) y la base real de Neon: la primera llamada sí le pega a Gemini y responde algo que menciona "Uber", la segunda llamada idéntica usa el caché, y una tercera con el mismo comercio pero folio numérico distinto también cachea — 1 sola llamada real a Gemini en las 3. Este script NO corre dentro de `pnpm test:smoke` (que sí corre seguido) sino en `pnpm test:smoke:gemini` aparte, porque pega a una API de pago cada vez.

**Telegram** (`linkTelegram.ts`, `handleTelegramMessage.ts`) — webhook en `app/api/telegram/webhook/route.ts`. Como la app es de un solo usuario, no hay invitaciones: el primer chat que manda `/start` o `/link` se queda vinculado (`users.telegramChatId`), y un segundo chat distinto se rechaza (no hay código de invitación todavía — ver backlog de multi-usuario).

Formato v1 de mensaje, determinístico (sin IA todavía): `"150 tacos"` = gasto $150, `"+20000 nómina"` = ingreso (el `+` es obligatorio para ingreso; sin signo o con `-` siempre es gasto), y `"150 tacos #efectivo"` para elegir la cuenta por nombre en vez de la primera de la family. Igual que CSV y la web, todo pasa por `RecordTransactionUseCase` — nunca un INSERT directo. El webhook siempre responde 200 (incluso si algo truena adentro) porque Telegram reintenta la entrega si no recibe 200, y un reintento procesaría el mismo mensaje dos veces.

Validado con la **Bot API real de Telegram** (`scripts/smoke-test-telegram.ts`): usé `getUpdates` para conseguir un chat_id real en vez de inventarlo, y las validaciones mandan mensajes de verdad — vinculación, segundo `/start` sin re-vincular, un chat distinto rechazado (con un sender falso para esa única rama, sin tocar la API real), gasto, ingreso, selección de cuenta por `#hint`, y un mensaje sin formato que no crea nada. Las 7 pasaron y llegaron los 6 mensajes reales a Telegram.

## Notas de lo encontrado al validar

- `neon-http` no soporta transacciones reales — se usa `neon-serverless` (ver `recordTransaction.ts`).
- `sql`${array}`` de Drizzle expande a placeholders separados (para `IN (...)`), no a un parámetro de tipo arreglo — `= ANY($1)` con un array interpolado así falla con "malformed array literal". Se usa `IN (${array})` en su lugar (ver `cashflow.ts`).
- `middleware.ts` se renombró a `proxy.ts` en Next 16 (misma función). La guía oficial de autenticación de Next recomienda exactamente el patrón que ya usamos: chequeo optimista (solo cookie) en `proxy.ts`, chequeo real (contra la base) en un DAL llamado desde cada página/Server Action.

## Pendiente

UI web para CSV import, limpieza de merchants, y para `DetectRecurringItemsUseCase`/`ProjectCashflowUseCase` (están probados a nivel de caso de uso, pero el dashboard todavía no los muestra); registrar el webhook de Telegram contra una URL pública real (deploy a Vercel — ver nota abajo); parseo de mensajes de Telegram en lenguaje natural vía Gemini en vez del formato rígido actual; el chat de IA sobre las finanzas.

**Nota sobre el webhook de Telegram en local:** `setWebhook` de Telegram exige una URL HTTPS pública — no funciona contra `localhost`. La validación de arriba llama a los casos de uso directamente (como si el webhook ya los hubiera invocado), no a través de una petición HTTP real a `/api/telegram/webhook`. Para probar el round-trip completo (Telegram → tu webhook) hace falta desplegar a Vercel, o un túnel como ngrok mientras tanto.
