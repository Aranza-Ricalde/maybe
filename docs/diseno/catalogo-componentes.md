# Catálogo de componentes (HeroUI primero)

Análisis de qué se puede volver genérico y reutilizable, y propuesta de catálogo por capas atómicas. Fecha: 2026-10-07, sobre el commit `3369bac`.

## Principio rector: HeroUI primero

Decisión del usuario (2026-10-07): **muchos componentes deben ser de HeroUI**; al definir bien el catálogo, toda la app queda alineada.

Reglas:

1. Si HeroUI v3 tiene el componente, **se usa HeroUI** (directo o con una envoltura delgada). No se reconstruye.
2. Una envoltura (átomo propio) solo se justifica cuando agrega algo de la app: tokens semánticos (tono de dinero), textos en español, formato regional, o una API más chica. Hoy varias envolturas no agregan nada.
3. Los componentes propios (organismos) componen componentes HeroUI y no replican su estilo con clases.
4. Los **componentes "Pro" de HeroUI** (sidebar, KPI cards, charts, etc. de los templates de referencia) requieren licencia y no están instalados: se replican los patrones con componentes libres, no se copia el código.

## Estado actual (medido)

| Capa | Archivos | Líneas | Observación |
|---|---|---|---|
| Atoms | 11 | 199 | Envoltorios delgados: `Button`, `Chip`, `Heading`, `Icon`, `Input`, `Label`, `Select`, `Text`, `CurrencyText`, `EyebrowLabel`, `Alert`. |
| Molecules | 43 | 1,417 | Base buena: `FormField`, `SegmentedButtons`, `InfoTooltip`, `EmptyState`, `PageHeader`. |
| Organisms | 65 | 5,067 | 72% del código de UI. Cajón de sastre: mezcla moléculas (`ConfirmDeleteButton`, `TabbedSections`) con componentes atados a un caso (`StatementReview` 264 líneas, `BudgetsTable` 221, `ExplorerCard` 213). |
| Templates | 8 | 618 | Cada una arma su página desde cero. |

Componentes de HeroUI que la app usa hoy (importaciones de `@heroui/react`): `Card` (24), `Button` (15), `Spinner` (4), `Select` (4), `CloseButton` (3), `Typography`, `TextField`, `Popover`, `Modal`, `ListBox`, `FieldError`, `Alert` (2 c/u), y 1 vez cada uno: `Tooltip`, `TextArea`, `Table`, `Switch`, `Skeleton`, `SearchField`, `RangeCalendar`, `Pagination`, `Label`, `Input`, `Chip`. Solo 2 archivos tocan el modal de HeroUI (`FormModal`, `DetailModal`).

## Duplicación detectada

| ID | Patrón | Dónde se repite | Reemplazo |
|---|---|---|---|
| C-01 | Barra de progreso | `BudgetsTable`, `GoalsTable`, `ExplorerBreakdown`, `ProgressListRow`, 2 en `ImportProgressPanel` | HeroUI **`ProgressBar`** (o **`Meter`** para valores acotados) envuelto en un átomo con tonos |
| C-02 | Mapa de tonos (verde/ámbar/rojo) | `BAR_TONE` (BudgetsTable), `DOT_COLORS` (StatusDot), `TONE` (ImportProgressPanel), `tone()` (CashProjectionCard), signo en `ExplorerCard` | Un solo mapa de tonos semánticos de dinero |
| C-03 | Tarjeta de sección (título, descripción, acción) | 21 `<Card className="p-5">`, 18 `Card.Title` | Molécula `SectionCard` sobre HeroUI `Card` |
| C-04 | Cifra con etiqueta y detalle | `StatBlock`, `StatBlockRow`, `DashboardKpiRow`, `AvailableToSpendCard`, `EmergencyFundCard`, `ProjectionSummary` | Molécula `MetricBlock` |
| C-05 | Avisos y callouts | `CaptureReviewBanner`, `TransferReviewBanner`, `RecurringBudgetDecisionBanner`, `ReviewAlert`, `FinancialStatusBanner` + 7 cajas de color ad hoc | `Callout` sobre HeroUI **`Alert`** (átomo `Alert` ya existe) y un `ReviewInbox` único |
| C-06 | Fila de lista | Movimientos, calendario, suscripciones, sugerencias, revisión de importación | Molécula `ListRow` (+ `ListGroup` con cabecera por día) |
| C-07 | Acciones de fila (editar/borrar) | 8 archivos | `RowActions` con HeroUI **`Dropdown`/`Menu`** para acciones secundarias; botones solo para la principal |
| C-08 | Filtros | `FilterPillPopover` (solo `AmountFilter`, `DateRangeFilter`), `ExplorerCard`, `AccountExplorerCard`, `TransactionsFilterBar` | `FilterBar` + `FilterPill` sobre HeroUI `Popover`, `Select`, `DateRangePicker`, `SearchField`, `NumberField` |
| C-09 | Tablas | 7 con `ClientDataTable`/`DataTable`, 3 `<table>` a mano (`BudgetsTable`, `CategoryStatsTable`, `LineEvolutionChart`) | `DataTable` sobre HeroUI **`Table`** con renderer de lista en móvil y `ScrollShadow` |
| C-10 | Dinero en pantalla | 27 `formatCurrency(` directos vs 18 `<CurrencyText` | Todo por `Money`/`CurrencyText` (centavos en menor peso, `tabular-nums`, tono) |
| C-11 | Texto secundario | 25 `text-xs text-muted` sueltos, 21 `<span className="text-…` | Variantes del átomo `Text` |
| C-12 | Plantillas de página | 8 templates con estructura distinta | `PageLayout` (encabezado, avisos, contenido) |
| C-13 | Capas confusas | `ConfirmDeleteButton`, `TabbedSections`, `InfoTooltip` viven entre organismos/moléculas | Reclasificar: lo genérico a `molecules/`, lo de un caso a una carpeta por función |
| C-14 | Diálogos | `FormModal`, `EntityFormModal`, `DetailModal` + ~15 modales | `ResponsiveDialog`: **`Modal`** en escritorio, **`Drawer`** (bottom sheet) en móvil; cambiar solo las 2 bases |
| C-15 | Notificaciones | `NotificationHost`/`NotificationToast` propios | Evaluar la cola de **`Toast`** de HeroUI (auto-cierre, apilado, accesibilidad) con contenido tipo `Alert` antes de mantener código propio |

## Catálogo objetivo

### Atoms (HeroUI + tokens de la app)

| Átomo | Base HeroUI | Para qué |
|---|---|---|
| `Button`, `IconButton` | `Button` | Jerarquía: un solo primario por contexto; icono con `aria-label` obligatorio |
| `Text`, `Heading`, `Eyebrow` | `Typography` | Escala tipográfica y variantes (secundario, nota) |
| `Money`/`CurrencyText` | — (propio) | Formato regional, signo, centavos en menor peso, tono semántico |
| `Chip`/`Badge` | `Chip`, `Badge` | Estados y contadores (no decorar) |
| `ProgressBar` | `ProgressBar`, `Meter` | Presupuestos, metas, importación |
| `Alert` | `Alert` | Base de avisos y notificaciones |
| `Skeleton`, `Spinner` | `Skeleton`, `Spinner` | Estados de carga con la forma real |
| `Divider` | `Separator` | Separar secciones sin cajas |
| `Avatar` | `Avatar` | Cuentas, comercios |

### Molecules

`SectionCard`, `MetricBlock`, `ListRow`, `ListGroup`, `RowActions` (con `Dropdown`), `Callout`, `FilterPill`, `SegmentedControl` (sobre `ToggleButtonGroup` o `Tabs`), `EmptyState` (sobre `empty-state` de HeroUI), `InfoTooltip` (`Tooltip`), `FormField` (`TextField`, `NumberField`, `Select`, `DatePicker`), `PageHeader`, `ConfirmDeleteButton` (sobre **`AlertDialog`**).

### Organisms

`AppNav` (barra lateral + barra inferior móvil + hoja "Más"), `DataTable` (con modo lista), `FilterBar`, `ResponsiveDialog`, `ReviewInbox` (un único buzón de pendientes), `NotificationHost`.

### Templates

`PageLayout` común; las 8 plantillas actuales se reducen a composición de bloques.

### Componentes HeroUI instalados que hoy no se aprovechan

`Tabs`, `ToggleButtonGroup`, `Drawer`, `AlertDialog`, `Dropdown`/`Menu`, `ProgressBar`, `Meter`, `Avatar`, `Badge`, `EmptyState`, `Toast`, `Separator`, `Surface`, `ScrollShadow`, `NumberField`, `DatePicker`/`DateRangePicker`, `Autocomplete`/`ComboBox`, `Disclosure`/`Accordion`, `Toolbar`, `Tag`/`TagGroup`, `Kbd`, `Breadcrumbs`.

## Reglas por capa

- **Atom:** sin dependencia de dominio ni de datos; una responsabilidad; props mínimas.
- **Molecule:** combina átomos para un patrón reutilizable (fila, bloque, campo); sin llamadas a servidor.
- **Organism:** sección funcional compuesta (tabla, barra de filtros, diálogo); recibe datos por props.
- **Template:** estructura de página; no conoce reglas de negocio.
- Lo atado a un caso (importación, presupuestos) se compone con lo genérico y vive junto a su función.
- Dominio y aplicación no se tocan: la UI solo cambia en `src/components` (más `src/app` y `src/lib` de presentación), respetando clean architecture.

## Orden de migración sugerido

1. **Fundaciones** (sin cambiar pantallas): tokens semánticos de dinero, átomos `ProgressBar`, `Money`, `Skeleton`, `Text` variantes.
2. **Bases de infraestructura de UI:** `ResponsiveDialog` (2 archivos), `AppNav`, `PageLayout`.
3. **Moléculas:** `SectionCard`, `MetricBlock`, `ListRow`, `RowActions`, `Callout`, `FilterPill`.
4. **`DataTable` con modo lista** y migración de las 10 tablas.
5. **Pantallas** por prioridad (ver README).

## Riesgos y notas

- Los specs de Cypress dependen de estructura (`tr`, `aria-label`, roles); cada migración debe actualizar sus selectores.
- `react-aria` cachea filas de colecciones: las filas de `Table` deben llevar su estado (`isExpanded`) en el objeto de la fila.
- Cambiar atoms existentes afecta a todo: migrar por capa y con la suite completa en verde en cada paso.
- No se mide aún cuánto código se ahorra; es una estimación a confirmar al migrar.
