# Referencia de diseño: shadcn-fintech y shadcn UI Kit

Estudio hecho el 2026-10-08, antes de tocar código. Fuentes: capturas de cada página en navegador (1440 px), el código del repositorio `abderrahimghazali/shadcn-fintech` (layout, sidebar, tokens, componentes) y las páginas del UI Kit de bundui (`/dashboard/finance`, `/dashboard/payment/transactions`, `/dashboard/crypto`, `/dashboard/apps/calendar`, `/dashboard/pages/notifications`).

## 1. Qué es cada referencia

**shadcn-fintech** (Next 16, Tailwind 4, Recharts 3.8, Geist). Páginas reales (13): Overview `/dashboard`, Accounts, Transactions, Cards, Transfers, Investments, Crypto, Analytics, Budgets, Notifications, Settings, Support, más Sign In / Sign Up. Es la referencia principal.

**shadcn UI Kit** (bundui). 16 dashboards (Classic, Sales, HR, CRM, Website Analytics, AI Analytics, File Manager, Crypto, Hospital, **Finance**, Logistics, Affiliate…), apps (Kanban, Notes, Chat, Mail, Todo, Tasks, **Calendar**, File Manager, API Keys…) y páginas (Users, Profiles, Onboarding, **Notifications**). Menú de iconos en riel + selector de equipo. Es referencia secundaria de patrones (KPI con insignia de cambio, tabla de pagos con filtros y paginación, lista de notificaciones).

## 2. Sistema visual que comparten

| Aspecto | Referencia |
|---|---|
| Estilo shadcn | `base-nova`, `baseColor: neutral`, íconos Lucide, **primitivos `@base-ui/react`** (se usa `render={<Link/>}` en lugar de `asChild`) |
| Paleta | Totalmente neutra en `oklch`: fondo blanco, `primary` casi negro (0.205), `muted` 0.97, borde 0.922. **Sin color de marca.** El color solo aparece con significado: esmeralda (sube/ingreso), rosa/rojo (baja/gasto), ámbar (pendiente/programado) |
| Gráficas | `--chart-1..5` son **escalas de gris** (0.87 → 0.269). Actual en negro/gris oscuro, comparación en gris claro. Las insignias de variación sí usan verde y rojo |
| Tipografía | Geist en todo; títulos de tarjeta `text-base font-semibold`; cifras `tabular-nums tracking-tight`; sin serif |
| Radio | `--radius: 0.625rem`; tarjetas `rounded-xl` |
| Tarjeta | `bg-card ring-1 ring-foreground/10`, `rounded-xl`, relleno compacto (`py-4`, `px-4`), sin sombra |
| Dark | clase `.dark`, `oklch(0.145)` de fondo, tarjetas 0.205, bordes `oklch(1 0 0 / 10%)` |

## 3. Layout y navegación

- `Sidebar variant="inset"`: el menú vive sobre el fondo gris muy claro (0.985) y **el contenido es un panel blanco redondeado con margen** (`SidebarInset`). Eso da la jerarquía de superficies que hoy nos falta.
- Cabecera dentro del panel (alto 64 px): `SidebarTrigger` · separador vertical · **breadcrumb dinámico** · a la derecha `⌘K` (paleta de comandos con `cmdk`) y selector de tema.
- Sidebar: encabezado (logo en cuadro + nombre + subtítulo), grupos con etiqueta (`Daily`, `Money`, `Insights`), bloque secundario al fondo (`Notifications` con insignia, `Settings`, `Help & Support`) y **menú de usuario** (avatar, nombre, correo, `ChevronsUpDown`, menú con cuenta, facturación y cerrar sesión).
- Cada ruta tiene `loading.tsx` con `Skeleton` y un `empty-state` genérico.

## 4. Patrones por página (qué copiar)

| Página de referencia | Patrón | Equivalente nuestro |
|---|---|---|
| Overview | Tarjeta grande "Financial Overview" (área con año actual vs anterior, selector de rango); tarjeta de tarjeta con saldo; "Quick Transfer"; "Monthly Spending Limit" (barra + gastado/restante); "Money Movement" (entra/sale/neto + barras negro/gris por día); "Financial Health" (medidor 0–100 + 6 barras de puntaje); "Recent Transactions" | **Resumen**: gráfica comparativa + límite mensual (nuestro presupuesto) + movimiento de dinero + últimos movimientos. El medidor de salud financiera lo podemos calcular con datos reales (tasa de ahorro, deuda, fondo de emergencia) |
| Accounts | 3 mini-tarjetas de resumen (icono en círculo + etiqueta + cifra); pestañas-píldora (Todas/Checking/Savings…); **cuadrícula de tarjetas** con borde de color a la izquierda, institución, nombre, número, saldo, insignia de variación y "hace cuánto" ; tarjeta punteada "Vincular cuenta" | **Cuentas** |
| Transactions | 4 mini-tarjetas (total entra, total sale, mayor, conteo); búsqueda + 2 selects + interruptor Todos/Ingresos/Gastos; tabla con casilla, comercio (logo + categoría en etiqueta), ID, monto en verde/negro, fecha y estado en insignia | **Movimientos** (hoy ya tiene filtros; cambiar a este formato) |
| Budgets | "Monthly Budgets": **anillos SVG por categoría** con icono al centro (rojo si se pasó); "Savings Goals" (tarjetas con barra, mensualidad, fecha meta y estado En camino/Atrasada); "Spending" calendario con intensidad de gris; "Month Projection" (días restantes, promedio/día, gastado, proyectado y mini área con línea de tope) | **Presupuestos** y **Metas** |
| Analytics | Mapa de calor anual de gasto; donut por categoría con total al centro y leyenda en 2 columnas; barras "este mes vs mes pasado" con % encima; "Recurring Charges" (lista con estado) ; "AI Insights" (tarjetas con insignia de % y categoría) | **Estadísticas** y **Recurrentes** |
| Investments | Teletipo, donut de asignación, gráfica con selector 1M/3M/6M/1Y, tabla ordenable con P&L | Gráfica con selector de rango y tabla ordenable (Estadísticas) |
| Settings | Menú lateral interno (Profile, Security, Notifications, Billing, Appearance) + tarjeta con formulario en 2 columnas | **Configuración** |
| Notifications (UI Kit) | Título con contador, "marcar todo como leído", búsqueda + filtros, lista con icono en círculo, punto azul de no leído, etiqueta de tipo y tiempo | **Pendientes** del Resumen |
| Payment/Transactions (UI Kit) | Pestañas Latest/Upcoming, botón Filters, tabla con insignias de estado en contorno de color, `Rows per page` | Calendario de pagos: "Por pagar / Pagado" |
| Finance (UI Kit) | KPI con título + insignia de % arriba, cifra grande, "compared to last month" y botones o mini-barras abajo | Franja de métricas del Resumen |

## 5. Componentes shadcn que usa la referencia

`avatar, badge, breadcrumb, button, calendar, card, chart, checkbox, collapsible, command, dialog, dropdown-menu, input-group, input, popover, progress, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, tooltip` + `cmdk`, `next-themes`, `motion`, `date-fns`, `react-day-picker`, `recharts`. Extras de lujo que no necesitamos: `@dnd-kit` (widgets arrastrables), `three`/`three-globe` (globo 3D), `@react-three/*`.

Ya tenemos casi todo en `src/components/ui`. Faltan `avatar`, `breadcrumb`, `slider` y `command` ya está.

## 6. Diferencias contra nuestra app hoy

1. Color: la referencia es monocromática con `primary` negro; nosotros usamos verde azulado y categorías con colores vivos.
2. Superficie: referencia = sidebar inset + panel blanco con tarjetas de borde fino; nosotros = página gris con mezcla de bloques planos y tarjetas.
3. Primitivos: referencia = Base UI (`render`); nosotros = Radix (`asChild`).
4. Cabecera: la referencia tiene breadcrumb, ⌘K y tema siempre visibles; nosotros no tenemos cabecera.
5. Menú: la referencia incluye menú de usuario y bloque de Ajustes/Notificaciones abajo.
6. Estados de carga: la referencia tiene `loading.tsx` por ruta; nosotros no.
7. Gráficas: la referencia usa tinta negra y gris; nosotros mezclamos colores sin sistema.

## 7. Decisiones que necesito confirmar antes de implementar

1. **Primitivos.** Opción A (recomendada): mantener Radix y copiar el sistema visual (tokens, tarjeta, layout inset, patrones). Mismo resultado visual, riesgo bajo, no se rompen los selectores de Cypress. Opción B: migrar a `base-nova`/Base UI como el template (cambia `asChild` por `render` y los atributos `data-*` en todos los componentes y pruebas).
2. **Color de acento.** Opción A (recomendada, fiel al template): neutro/negro como `primary`, y color solo para significado (verde/rojo/ámbar). Opción B: conservar el verde azulado como acento de marca.
3. **Datos que no tenemos**: logos de comercios, avatares de contactos, tarjetas físicas, cripto, inversiones. Usaríamos iniciales en círculos y omitiríamos esas secciones. Transferencias entre cuentas ya existe como tipo de movimiento.

## 8. Plan propuesto (sin código hasta confirmar)

1. **Base:** tokens neutros de la referencia (claro/oscuro con clase), `Card` con `ring-1`, `Sidebar variant="inset"`, cabecera con breadcrumb + ⌘K (`command`) + tema, menú de usuario, bloque Ajustes/Ayuda abajo, `loading.tsx` por ruta, `empty-state`.
2. **Componentes genéricos nuevos** (presentacionales, sin lógica): `StatTile` (icono en círculo + etiqueta + cifra + insignia), `ChangeBadge`, `ProgressRing`, `Gauge`, `HeatmapCalendar`, `PillTabs`, `AccountCard`, `PageHeader` con breadcrumb. Los cálculos van a `domain/` y `lib/presenters/` con pruebas.
3. **Páginas**, en este orden: Resumen → Movimientos → Cuentas → Presupuestos+Metas → Estadísticas → Recurrentes → Configuración → Importar.
4. **Verificación por página**: capturas 375/768/1440, claro/oscuro, e2e y tipos.
