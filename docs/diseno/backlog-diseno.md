# Backlog de diseño y componentes

Cada hallazgo de la auditoría y del análisis de código, con ID, para que nada se pierda. Estado: `[ ]` pendiente, `[~]` en curso, `[x]` hecho. Evidencia en [`capturas/`](./capturas). Detalle en [`auditoria-2026-10.md`](./auditoria-2026-10.md) y [`catalogo-componentes.md`](./catalogo-componentes.md).

Severidad: CRÍTICA, ALTA, MEDIA, BAJA. Esfuerzo: S, M, L.

## Migración a shadcn/ui (decisión 2026-10-07, detalle en [`migracion-shadcn.md`](./migracion-shadcn.md))

- [ ] **S-00 · Fundaciones (S0):** `shadcn init`, puente de tokens (`--sc-*`), modo oscuro con `data-theme`, codemod de clases heredadas, componentes base.
- [ ] **S-01 · Shell de navegación (S1):** `Sidebar` de shadcn + barra inferior móvil + hoja "Más". Sustituye a D-01 con piezas propias.
- [ ] **S-02 · Átomos y moléculas (S2).**
- [ ] **S-03 · `ResponsiveDialog` y formularios (S3).**
- [ ] **S-04 · Tablas, listas y calendario en rango (S4).**
- [ ] **S-05 · Pantallas una por una con el estilo de Importar (S5).**
- [ ] **S-06 · Gráficas con `Chart` de shadcn y retiro de HeroUI, react-aria y Gravity (S6).**

## Críticos y altos de diseño

- [x] **D-01 · CRÍTICA · L — Sin navegación móvil.** *Hecho 2026-10-07: `AppNav` = `AppSidebar` (desde `md`) + `BottomNav` (barra inferior de 4 destinos y hoja "Más" con HeroUI `Drawer`), configuración única en `navItems.tsx`, `isNavActive` con pruebas, `h-dvh`, safe areas y panel de importación sin tapar la barra. Verificado en Chrome a 320/375/768/1440 y con specs e2e.* `src/components/templates/AppShell.tsx:10`, `src/components/organisms/AppSidebar.tsx`. Menú fijo de 240 px a todos los anchos; a 375 px el contenido útil son 135 px. → `AppNav`: barra inferior de 4 destinos + hoja "Más"; menú lateral desde `md`.
- [x] **D-02 · CRÍTICA · M — Modo oscuro roto.** *Hecho 2026-10-07: tema Sistema/Claro/Oscuro en Configuración → Apariencia (`useThemePreference`, `ThemeSwitch`, `lib/theme.ts` con pruebas, script `beforeInteractive` sin parpadeo), tokens oscuros de éxito/advertencia/error/acento con contraste y eliminado el parche del acento por `prefers-color-scheme`. Pendiente: semánticos de dinero (D-12) y revisar contraste AA exacto.* `src/app/globals.css:26-37`. Solo cambia el acento; superficies claras; el tema oscuro real (`data-theme="dark"`) es inalcanzable y casi negro puro. → Tema oscuro real (grises profundos, sin negro puro), interruptor y semánticos con contraste AA en ambos modos. *Pendiente decisión Q-06.*
- [ ] **D-03 · ALTA · L — Tablas con ancho mínimo fijo y sin lista móvil.** 10 componentes: `PayPeriodsTable` 420, `PayMonthsTable` 420, `TransactionsExplorer` 680, `RecurringItemsTable` 820, `CategoriesTable` 520, `DataTable` 480, `CategoryStatsTable` 960, `AccountsTable` 640, `BudgetsTable` 640, `GoalsTable` 760. → `DataTable` con modo lista (C-09).
- [ ] **D-04 · ALTA · M — Modales centrados.** 37 archivos con Modal, 0 con Drawer; solo `FormModal` y `DetailModal` tocan el modal de HeroUI. → `ResponsiveDialog` (C-14).
- [ ] **D-05 · ALTA · S — Inputs menores a 16 px** (zoom iOS): Recurrentes 7, Movimientos 2, Cuentas 2, Configuración 2, Metas 1 (a 375 px).
- [ ] **D-06 · ALTA · M — Áreas táctiles menores a 44 px** (375 px): Movimientos 82/83, Resumen 44/57, Presupuestos 39/39, Gasto 39/55, Recurrentes 33/33, Configuración 46/47, Cuentas 25/30, Proyección 20/22, Metas 17/17, Importar 13/13.
- [ ] **D-07 · ALTA · M — Avisos "por revisar" sin patrón único.** `CaptureReviewBanner`, `TransferReviewBanner`, `RecurringBudgetDecisionBanner`, `ReviewAlert`, `FinancialStatusBanner` + 7 cajas ad hoc. → `Callout` + `ReviewInbox` (C-05).
- [ ] **D-08 · ALTA · S — Mensajes contradictorios en Resumen.** Aviso rosa "Podrías terminar por encima de tu presupuesto" sobre tarjeta verde "te alcanza hasta el fin del periodo". → una sola voz de estado. *Pendiente decisión Q-02.*

## Medios

- [~] **D-09 · MEDIA · S — Técnico:** *Hecho: `dvh`, safe areas y `viewport-fit=cover`. Falta: `prefers-reduced-motion` y revisar `hover:`.*  `h-screen` → `dvh`; safe areas; `prefers-reduced-motion`; revisar 23 `hover:` sin equivalente táctil.
- [ ] **D-10 · MEDIA · M — Exceso de cards:** Resumen ~17, Proyección ~21, Configuración ~20 elementos `.card` (sobrestima); `SettingsPageTemplate` con 16 `Card`. → listas/secciones con divisores; cards solo para objetos (cuenta, meta).
- [ ] **D-11 · MEDIA · S — Más de un botón primario por contexto:** Resumen 3, Recurrentes 3.
- [ ] **D-12 · MEDIA · M — Tema parcial:** sin semánticos de dinero (ingreso, gasto, deuda, ahorro, alerta, sobre presupuesto); valores arbitrarios `text-[10px]` ×2, `text-[11px]`; radios mezclados; 6 sombras sueltas.
- [ ] **D-13 · MEDIA · M — `loading.tsx` único y genérico.** → skeletons con la forma de cada pantalla.
- [ ] **D-14 · MEDIA · S — Login genérico** (tarjeta centrada con logo) y sin botón para ver contraseña.

## UX por pantalla

- [ ] **U-01 · Resumen:** KPIs desiguales ("Ver detalle →" se parte en 2 líneas en Deuda); 4 iconos (i); gráfica del Explorador ocupa mucho con 1 sola barra; pestaña "Qué cambió" de "Por revisar" es un insight, no un pendiente; calendario con 3 botones por fila (Elegir movimiento, Marcar pagado, Omitir) → 1 principal + menú.
- [ ] **U-02 · Gasto por categoría:** el Explorador duplica el del Resumen y va primero; la tabla de categorías (el título de la pantalla) queda al final; 11 tablas en el DOM; contadores sin sentido en pestañas ("Comercios (1)"). *Pendiente decisión Q-03.*
- [ ] **U-03 · Movimientos:** fecha completa repetida en cada fila → agrupar por día; 3 iconos de acción por fila; sin resumen de filtros activos. *Pendiente decisión Q-04.*
- [ ] **U-04 · Presupuestos:** 14 iconos (i) (2 por fila) meten ruido → mostrar solo donde aporte o al enfocar; chip "Se pasó · 120%" redundante con la barra; el banner de decisión se repite en Recurrentes.
- [ ] **U-05 · Cuentas:** "Mostrar 10" y contador con 4 filas (ocultar cuando cabe todo); gráfica sin ejes.
- [ ] **U-06 · Recurrentes:** 3 bloques antes de la tabla (decisión de presupuesto, posibles recurrentes, nota); 2 interruptores por fila con "Sin decidir" junto a un interruptor encendido (contradictorio).
- [ ] **U-07 · Proyección:** enlace "Cambiar ($0)" poco claro (saldo mínimo).
- [ ] **U-08 · Metas:** el fondo de emergencia muestra un guion enorme; el texto "Al ritmo actual" ocupa 3 líneas densas.
- [ ] **U-09 · Configuración:** 7 cards sin relación apiladas; "Cómo ver tus periodos" muy abajo; bloque del token técnico (POST a localhost en monoespaciado). → secciones con subnav. *Pendiente decisión Q-05.*

## Código y componentes (HeroUI primero)

- [ ] **C-01 ·** Átomo `ProgressBar` sobre HeroUI `ProgressBar`/`Meter` (5 implementaciones).
- [ ] **C-02 ·** Un solo mapa de tonos semánticos de dinero (`BAR_TONE`, `DOT_COLORS`, `TONE`, `tone()`).
- [ ] **C-03 ·** `SectionCard` (21 `<Card className="p-5">`, 18 `Card.Title`).
- [ ] **C-04 ·** `MetricBlock` (6 componentes de cifra con etiqueta).
- [ ] **C-05 ·** `Callout` sobre HeroUI `Alert` + `ReviewInbox`.
- [ ] **C-06 ·** `ListRow` y `ListGroup` (cabecera por día).
- [ ] **C-07 ·** `RowActions` con HeroUI `Dropdown`/`Menu` (8 archivos).
- [ ] **C-08 ·** `FilterBar` + `FilterPill` (3 implementaciones) sobre `Popover`, `Select`, `DateRangePicker`, `SearchField`, `NumberField`.
- [ ] **C-09 ·** `DataTable` sobre HeroUI `Table` con modo lista y `ScrollShadow` (10 tablas).
- [ ] **C-10 ·** `Money`/`CurrencyText` para todo el dinero (27 `formatCurrency(` directos vs 18 `CurrencyText`).
- [ ] **C-11 ·** Variantes del átomo `Text` (25 `text-xs text-muted` sueltos).
- [ ] **C-12 ·** `PageLayout` común para las 8 plantillas.
- [ ] **C-13 ·** Reclasificar organismos genéricos a moléculas (`ConfirmDeleteButton`, `TabbedSections`, `InfoTooltip`).
- [ ] **C-14 ·** `ResponsiveDialog` (Modal/Drawer) sustituyendo las 2 bases de diálogos.
- [ ] **C-15 ·** Evaluar HeroUI `Toast` frente a `NotificationHost` propio.
- [ ] **C-16 ·** Aprovechar componentes HeroUI no usados: `Tabs`, `ToggleButtonGroup`, `Drawer`, `AlertDialog` (confirmaciones), `Dropdown`, `Avatar`, `Badge`, `EmptyState`, `Skeleton`, `Separator`, `ScrollShadow`, `NumberField`, `DatePicker`.

## Gráficas con Recharts (detalle en [`graficas.md`](./graficas.md))

- [ ] **G-00 · M — Base de gráficas:** `chartTheme` (tokens de dinero y categorías, modo oscuro), `ChartCard` (HeroUI `Card` + `Tabs`), `ChartTooltip`, `ChartLegend`, `ChartEmpty`, `ChartSkeleton`, `TimeSeriesChart` con series declarativas y carga diferida (`next/dynamic`).
- [ ] **G-01 · M — Retirar** `LineEvolutionChart` (SVG a mano, 3 usos) y las barras de `div` de `ExplorerBreakdown`/`NatureBreakdownCard`; conservar la tabla accesible alternativa.
- [ ] **G-A · Ingresos vs gastos** (`ComposedChart` con neto y periodo anterior).
- [ ] **G-B · Gasto por categoría en el tiempo** (barras apiladas, top 8 + "Otras", leyenda clicable).
- [ ] **G-C · Composición del gasto** (Treemap/Sunburst con drill-down; dona top 5).
- [ ] **G-D · Ranking de comercios** (barras horizontales).
- [ ] **G-E · Presupuesto vs real** (bullet con línea de tope).
- [ ] **G-F · Flujo del ingreso** (Sankey ingresos → gastos → deuda → ahorro → libre).
- [ ] **G-G · Patrimonio** (área apilada de activos y pasivos + línea de neto).
- [ ] **G-H · Saldo por cuenta** (una línea por cuenta).
- [ ] **G-I · Evolución y liquidación de deuda.**
- [ ] **G-J · Ahorro y tasa de ahorro** (eje secundario).
- [ ] **G-K · Progreso de metas** (anillos radiales).
- [ ] **G-L · Saldo proyectado** (banda de escenario, saldo mínimo y zona de riesgo).
- [ ] **G-M · "¿Qué cambió?"** (cascada del periodo anterior al actual, con clic a movimientos).
- [ ] **G-N · Esencial vs discrecional.**
- [ ] **G-O · Categorías contra su promedio** (mini gráficas).
- [ ] **G-P · Gastos inusuales y hormiga** (dispersión).
- [ ] **G-Q · Suscripciones** (barras horizontales y total anual).
- [ ] **G-R · Funciones de dominio con pruebas** para las series nuevas (apiladas, neto, jerarquía, Sankey, cascada, presupuesto contra real).

## Ideas inspiradas en los templates de HeroUI (no pedidas)

- [ ] **I-01 ·** Exportar movimientos a CSV.
- [ ] **I-02 ·** Badge "Nuevo" en la entrada de menú de Importar estados.
- [ ] **I-03 ·** Avatares/iconos por cuenta y comercio.
- [ ] **I-04 ·** Atajos de periodo como pestañas (7D / 30D / 90D / 12M).
