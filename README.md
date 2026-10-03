# Maybe v2

Rediseño de [Maybe](../maybe) (antes Ruby on Rails self-hosted) en Next.js + TypeScript, para uso personal/familiar. El plan completo — qué se recuperó, qué se descartó, el esquema de datos y la arquitectura — vive en el documento del proyecto (ver conversación de planeación).

**Producción:** https://maybe-v2.vercel.app

## Stack

- **Next.js** (App Router) + TypeScript
- **Drizzle ORM** + **Neon** (Postgres serverless, driver `neon-serverless` — `neon-http` no soporta transacciones)
- **Hero UI v3** (Tailwind CSS v4 nativo, construido sobre React Aria) + Tailwind v4 para el diseño
- Deploy: **Vercel** · IA: **Gemini API** · Captura rápida: **bot de Telegram** (@V2_MaybeBot)

## Arquitectura

### Backend — Clean Architecture

```
src/
  domain/          # Entidades y reglas de negocio puras — sin imports de Next.js ni Drizzle
  application/      # Casos de uso (RecordTransactionUseCase, etc.) — orquestan domain/ + repos
  infrastructure/
    db/
      schema/       # Tablas de Drizzle, una por dominio (accounts.ts, transactions.ts, ...)
      client.ts     # Conexión a Neon
    auth/           # scrypt + tokens de sesión (node:crypto, sin dependencias nuevas)
    gemini/         # Cliente de la REST API de Gemini (fetch, sin SDK)
    telegram/       # Cliente de la Bot API de Telegram (fetch)
    container.ts    # Raíz de composición — une cada caso de uso con su implementación
```

Regla de oro: **nunca se inserta una transacción fuera de `RecordTransactionUseCase`** — web, import CSV y Telegram los tres lo llaman, para que los agregados precalculados nunca se desincronicen.

### Frontend — Atomic Design sobre Hero UI

```
src/components/
  molecules/    # StatCard, FormField (TextInput/SelectField), EmptyState — componen primitivos de Hero UI
  organisms/    # AppSidebar, AppTopbar — piezas completas de UI con su propio estado/datos
  templates/    # AppShell — el layout que envuelve toda página autenticada
src/app/
  (app)/        # Grupo de rutas autenticadas — layout.tsx llama requireUser() una vez y monta AppShell
    page.tsx          # Resumen (dashboard)
    accounts/         # Cuentas
    transactions/      # Movimientos
    budgets/           # Presupuesto del mes
    recurring/          # Recurrentes + candidatos detectados
    goals/              # Metas de ahorro
    settings/            # Familia, tu cuenta, categorías
  login/        # Fuera del grupo (app) — layout propio, sin sidebar
  lib/queries.ts # Lecturas simples (listar cuentas, transacciones...) — sin ceremonia de caso de uso
```

No hay carpeta `atoms/` separada a propósito: los átomos (Button, Input, Card, Badge...) son los primitivos de Hero UI usados directamente — envolverlos de nuevo solo para llamarlos "átomos propios" sería una capa sin valor real.

**Por qué Hero UI**: construido nativo sobre Tailwind CSS v4 y React 19 (peer deps `react >=19`, `tailwindcss >=4` — exactamente nuestra versión, no una más vieja a la que haya que bajar), así que no hubo que pelear con un plugin de Tailwind v3 ni un provider de contexto — se verificó instalando y compilando antes de construir todo el sistema de diseño encima. El acento de marca (`--accent: #0d7d6f`, verde ledger) se definió sobre su sistema de tokens en `globals.css`; el resto (hover, soft, radios, sombras) se calcula solo a partir de ese token — no se tocan a mano.

## Setup

```bash
pnpm install
# neon link ya dejó DATABASE_URL en .env.local — ver .env.example para las demás vars (GEMINI_API_KEY, TELEGRAM_BOT_TOKEN)

pnpm db:push             # aplica el esquema a tu base de Neon (25 tablas)

# Setup único — crea la ÚNICA family + primer usuario (no es un signup público, se rechaza si ya existe una family).
# La contraseña se pide interactivamente, nunca por flag (no queda en el historial de la shell):
pnpm exec tsx --env-file=.env.local scripts/bootstrap.ts --email tu@correo.com --name "Tu Nombre"

pnpm dev                 # http://localhost:3000
```

### Validación

```bash
pnpm test:unit           # 55 unit tests de domain/ — puros, sin DB, con node:test (nada nuevo que instalar)
pnpm test:smoke          # ledger, recurring, cashflow, csv-import — contra la base real de Neon, crean y limpian sus propios datos
pnpm test:smoke:gemini   # limpieza de merchants contra la Gemini API real — aparte porque es una API de pago
```

`test:unit` cubre las reglas puras de los 7 archivos de `domain/*/rules.ts` (ledger, auth, cashflow, recurring, csvImport, merchants, telegram) — casos límite como: tolerancia de monto/día en la detección de recurrentes, parseo de CSV con comillas y comas, fechas US vs ISO, el `Math.min(0, ...)` que evita que el gasto variable proyectado se vuelva positivo, etc. Un hallazgo real al escribirlos: en `domain/telegram/rules.ts::parseTelegramMessage`, la rama que lanza "Falta la descripción del movimiento" es código muerto — por cómo se componen los dos regex (el externo ya consume todo el espacio en blanco antes de separar el hint), no hay ningún mensaje de Telegram real que llegue a esa rama. No la quité (no es lo que se pidió), solo quedó documentada en el test que explica por qué.

`smoke-test-auth.ts` se niega a correr si ya existe una family real en la base (es la misma protección de `BootstrapFamilyUseCase`) — desde que se corrió el bootstrap real, ese script queda bloqueado a propósito y no corre dentro de `pnpm test:smoke`'s wrapper sin falla.

La capa `app/` (login, sesión, proxy, cada una de las 8 páginas) se validó con peticiones HTTP reales — login/logout con `curl` + cookie jar, y las 7 páginas autenticadas con una sesión de prueba minteada directo en la base (nunca con la contraseña real) para confirmar que cada una responde 200, muestra el contenido correcto, y que los tokens de diseño (`--accent`, etc.) llegan al CSS compilado. **No validé clic por clic cada formulario** (crear cuenta, guardar presupuesto, aceptar un recurrente, crear meta) — esos son Server Actions, no se simulan bien con `curl` sin un navegador real. La lógica que ejecutan ya está probada (reusan `RecordTransactionUseCase`, o son inserts triviales de una sola fila); falta el clic real.

## Estado actual

- **Esquema completo** (25 tablas) aplicado a Neon — incluye `sessions`.
- **Casos de uso con puerto + Drizzle + validación real**: `RecordTransactionUseCase`, `DetectRecurringItemsUseCase`, `ProjectCashflowUseCase`, `ImportCsvUseCase`, `CleanMerchantNameUseCase` (Gemini), autenticación (bootstrap/login/logout/validateSession), Telegram (link/handleMessage).
- **8 páginas reales**: resumen, cuentas, movimientos, presupuesto, recurrentes, metas, configuración, login — con diseño real (Hero UI + tokens de marca), no HTML sin estilo.
- **Desplegado en producción** (Vercel) con el webhook de Telegram registrado contra la URL real.
- **Pendiente**: probar cada formulario con clic real en el navegador; exportar a Excel; chat de IA sobre las finanzas; import de CSV y limpieza de merchants todavía sin UI (solo backend).
