# Plan de la versión móvil

Decisión de arquitectura (Fase 1): una composición por página, CSS para lo visual, y componentes de presentación pequeños solo donde cambia la estructura. Se mantiene `useIsMobile` donde ya se usa (Dialog/Drawer, tabla/filas). Sin provider de viewport, sin presentadores por dispositivo, sin plantillas duplicadas.

Lo verificado en el repositorio está en la Fase 1. Lo marcado **(por verificar)** se comprueba al implementar.

## Piezas nuevas (cada una con más de un uso)

| Componente | Capa | Qué hace | Dónde se usa |
|---|---|---|---|
| `molecules/FloatingActionButton.tsx` | molécula | Enlace flotante, solo móvil (`md:hidden`), encima de la barra inferior | `AppShell`, una sola instancia |
| `molecules/QuickActions.tsx` | molécula | Cuadrícula de 4 accesos (icono + etiqueta), solo móvil | Resumen |
| `molecules/ResponsiveTabs.tsx` | molécula | Estado propio + `PillTabs`; en escritorio todas las secciones visibles apiladas, en móvil una a la vez. Un solo DOM, sin JS de viewport | Resumen, Presupuestos y metas |
| `molecules/ExpandableList.tsx` | molécula | Lista con tope en móvil y botón "Ver todo" que expande en el mismo lugar; escritorio sin cambio | Avisos, calendario, últimos movimientos, Estadísticas |

No se usa `ui/tabs` (Base UI) para esto: marca los paneles inactivos con `hidden`, y no he comprobado cómo interactúa con la regla `[hidden]` de Tailwind **(por verificar)**; un estado propio es más simple y no depende de eso.

Datos de los accesos directos: `lib/presenters/dashboard.ts` expone `quickActions()` como datos puros (clave, etiqueta, ruta de `ROUTES`), con prueba unitaria. El mapa clave → icono vive en el componente, igual que `MetricStrip`.

## Cambios compartidos

| Archivo | Cambio |
|---|---|
| `templates/AppShell.tsx` | Renderiza el botón flotante; padding y separación más compactos en móvil |
| `organisms/FormModal.tsx` y `CreateTransactionModal.tsx` | Prop opcional `defaultOpen` |
| `organisms/TransactionsPageClient.tsx` y `domain/shared/routes.ts` | El parámetro `?nuevo=1` abre el modal de alta; el botón flotante apunta ahí |
| `molecules/MetricStrip.tsx` | Cuadrícula 2×2 compacta en móvil (CSS) |

## Por pantalla

### Resumen
- `app/(app)/page.tsx` pasa a `templates/DashboardPageTemplate.tsx`: misma composición, por consistencia con las demás páginas.
- `DashboardHero`: el botón "+ Registrar" se oculta en móvil (lo cubre el botón flotante).
- `QuickActions` debajo del encabezado: Registrar, Importar, Presupuestos y Estadísticas.
- `AvailableToSpendCard`: la línea de compromisos se oculta en móvil; el detalle sigue en "Ver detalle".
- Límite de gasto, Movimiento de dinero y Salud financiera: una sola zona con `ResponsiveTabs` (en escritorio siguen siendo tres tarjetas).
- `AttentionSection`: avisos con `ExpandableList`, tope 3 en móvil (escritorio 4, sin cambio).
- `FinancialCalendarCard`: "Por pagar" con `ExpandableList` tope 3; "Ya pagado" y "Omitido" detrás del botón.
- `RecentMovementsCard`: tope 5 en móvil (escritorio 6).
- Objetivo: ≤ 1,700 px de alto a 375 (hoy ≈ 4,100 a 320).

### Movimientos
- `TransactionsFilterBar`: el buscador sigue visible; el resto de filtros en un botón "Filtros" (con conteo de activos) que abre `ResponsiveDialog`. Los campos son un único componente de campos, renderizado en línea en escritorio y dentro del diálogo en móvil.
- `DataTable`: variante opcional `mobileLayout="compact"` (nombre y monto en una línea, cuenta y categoría debajo, sin etiquetas "Monto"). Es opt-in: las otras 4 tablas que usan `DataTable` no cambian.
- Se mantiene la agrupación por día (`mobileGroup`).
- Objetivo: filas de ≈ 64 px (hoy ≈ 108).

### Presupuestos y metas
- `BudgetsPageTemplate`: `ResponsiveTabs` con Presupuestos | Metas.
- Resumen y fondo de emergencia más compactos (CSS).
- "Sin presupuesto" ya es plegable; se evalúa en pantalla si conviene empezar plegado en móvil.

### Cuentas
- `AccountsPageTemplate` y `AccountsList`: tarjetas compactas en móvil (CSS) y patrimonio neto destacado; el detalle ya está en hoja (`AccountDetailSheet`).

### Estadísticas
- `StatsPageTemplate`: filtros en `ResponsiveDialog` en móvil; tabla de detalle detrás de `ExpandableList`; métricas 2×2.
- **(por verificar)**: el gráfico de Recharts dentro de una pestaña inactiva; no se aplica si el gráfico queda fuera de `ResponsiveTabs`.

### Recurrentes
- `RecurringItemsTable` usa `mobileLayout="compact"`; los avisos de nómina y de decisión se compactan.

### Configuración
- Sin cambios estructurales ahora. La idea de "lista de ajustes" que abre cada sección es una diferencia de interacción real; se decide al final, con capturas de las demás pantallas, si justifica una composición distinta.

## Validación por fase
- Pruebas unitarias nuevas: `quickActions()` y cualquier lógica pura que se extraiga.
- Cypress en viewport móvil (390×844): botón flotante visible y abre el alta; accesos directos navegan; las pestañas cambian; "Ver todo" expande; filtros en hoja. En escritorio: sin botón flotante ni accesos.
- Altura medida por pantalla con capturas (375×812) contra los objetivos de arriba.
- Consola sin errores de hidratación (captura a 320/390/768/1440), tsc, eslint, build.
- Revisión visual en claro y oscuro.

## Orden
1. Piezas nuevas + shell + Resumen.
2. Movimientos (y `DataTable` compacto).
3. Presupuestos y metas + Cuentas.
4. Estadísticas, Recurrentes y decisión de Configuración.

## Verificaciones previas a la Fase 3 (resultados)

| Pendiente o riesgo | Resultado | Cómo se ataca |
|---|---|---|
| Usar `ui/tabs` (Base UI) para apilar en escritorio | **Descartado.** El CSS compilado trae `[hidden]:where(:not([hidden=until-found])){display:none!important}` y el panel inactivo de Base UI se marca con `hidden` | `ResponsiveTabs` con estado propio y `max-md:hidden` en los paneles inactivos |
| Recharts dentro de un panel que nace oculto | **Funciona.** Probado con una página temporal (ya borrada): oculto no pinta, al mostrarlo mide bien (358×192 a 390) y en escritorio ambos paneles salen completos | Se pueden meter los gráficos en `ResponsiveTabs` sin tratamiento especial |
| Alta con `?nuevo=1` abriendo el modal | **Funciona.** Un `ResponsiveDialog` que nace abierto abre en Dialog (1280) y en Drawer (390), sin errores de hidratación | `useFormModalController` recibe `defaultOpen` (hoy `useState(false)`); `SEARCH_PARAM` y `TransactionsSearchParams` ganan `nuevo` |
| Ids duplicados al renderizar los filtros en dos sitios | **No aplica hoy.** Ni `FilterSelect`, `DateRangeFilter`, `AmountFilter` ni `TransactionsFilterBar` usan `id`, `htmlFor` o `useId` | Un solo componente de campos; si aparece un `id` fijo, se cambia por `useId` |
| Parpadeo de la tabla de escritorio en móvil (`DataTable`, `StatsTable`) | **No se observa.** Con un móvil lento (CPU ×4) en Recurrentes, Estadísticas y Configuración, nunca hubo una tabla visible en móvil; las filas móviles aparecen a los 120–377 ms | No se trata. La idea de corregirlo se retira del plan |
| `DataTable` compartido por 5 tablas | Pendiente de diseño, sin riesgo técnico | Prop opcional `mobileRole` por columna (`title` / `subtitle` / `amount` / `hidden`); solo las tablas que la usen cambian |

Nota sobre el parpadeo: con JavaScript desactivado el servidor entrega solo el esqueleto de carga (el contenido llega por streaming), así que esa prueba no sirve para medirlo; usé una línea de tiempo con JavaScript activo.
