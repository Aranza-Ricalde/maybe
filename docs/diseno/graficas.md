# Gráficas con Recharts

Análisis de qué hay hoy y de cómo aprovechar Recharts (v3.10, ya instalado) para mostrar datos más complejos, con varias series y filtros. Fecha: 2026-10-07, sobre el commit `3369bac`. Solo análisis: no se ha cambiado código.

## Decisión del usuario

Usar **Recharts** para las gráficas y **no limitarse a barras**: la app tiene datos complejos que se pueden mostrar con gráficas más ricas, que permitan identificar varios datos a la vez y filtrar. Recharts es la base. Con la decisión de usar shadcn/ui, el contenedor y el tema salen del componente `chart` de shadcn (construido sobre Recharts v3: `ChartContainer`, `ChartConfig`, `ChartTooltip`, `ChartLegend`), junto con `Card`, `Tabs`, `Toggle Group`, `Popover`, `Select` y `Skeleton` de shadcn.

## Estado actual

| Pieza | Tecnología | Observación |
|---|---|---|
| `ExplorerFlowChart` | Recharts `BarChart` | Barras de ingresos y gastos por periodo. Tooltip propio. Sin leyenda interactiva, sin comparación. |
| `ProjectionBalanceChart` | Recharts `LineChart` | Saldo base y escenario. Tooltip distinto al anterior (`contentStyle`). Sin referencia del saldo mínimo. |
| `LineEvolutionChart` | **SVG hecho a mano** (130 líneas) | Lo usan `AccountExplorerCard`, `ExplorerCard` y `CashProjectionCard`. Sin ejes, leyenda ni varias series. Trae tabla accesible alternativa (buena práctica a conservar). |
| `ExplorerBreakdown`, `NatureBreakdownCard`, barras de presupuesto/metas | **`div` con ancho en %** | No son gráficas, son barras dibujadas con CSS. |

Problemas comunes: 3 formas distintas de tooltip, ejes y formatos copiados en cada archivo, animaciones apagadas, `useIsClient` repetido, ninguna gráfica ofrece zoom, comparación o filtro por serie, y en datos escasos se ve una sola barra enorme (Resumen, captura `resumen_tall.png`). Solo 2 archivos importan Recharts; el resto se resolvió a mano.

## Qué ofrece Recharts 3.10 (instalado)

Contenedores: `LineChart`, `AreaChart`, `BarChart` (con `BarStack`), `ComposedChart`, `PieChart` (dona), `RadialBarChart`, `RadarChart`, `ScatterChart`, `FunnelChart`, `Sankey`, `Treemap`, `SunburstChart`. Complementos: `Brush` (zoom), `ReferenceLine`, `ReferenceArea`, `ReferenceDot`, `ErrorBar`, `Legend`, `Tooltip`, `ZAxis` (tamaño de burbuja).

## Mapa de datos → gráfica

Las columnas de "Datos" indican la fuente que ya existe en dominio/aplicación; la forma exacta de cada serie se confirma al implementar.

| ID | Pregunta que responde | Gráfica | Datos | Filtros / interacción |
|---|---|---|---|---|
| G-A | ¿Cuánto entra y cuánto sale? | `ComposedChart`: barras de ingresos y gastos + línea de neto, con el periodo anterior en línea punteada | `ExplorerPoint` (`composeSeries`) + `previousRange` | Rango, granularidad día/semana/mes, cuenta, categoría, comercio, naturaleza; alternar series; comparar con periodo anterior |
| G-B | ¿En qué categorías se va el dinero y cómo cambia? | **Barras apiladas por categoría en el tiempo** (top 8 + "Otras") | `ExplorerRow` (cubo × categoría) | Leyenda clicable para ocultar series; clic en un segmento filtra por esa categoría |
| G-C | ¿Cómo se compone el gasto (padre → subcategoría)? | **Treemap** o `SunburstChart` con "entrar" a la categoría; dona para el top 5 | `sharesByCategory` (jerarquía padre/hijo) | Clic para bajar de nivel; migas de pan para volver |
| G-D | ¿Qué comercios consumen más? | Barras horizontales ordenadas | `sharesByMerchant` | Topes 5/10; excluir "sin comercio identificado" |
| G-E | ¿Cumplo mi presupuesto? | **Barras horizontales tipo bullet** (real contra tope, con `ReferenceLine` del presupuesto) | Jerarquía de presupuesto (`rollUpBudgetHierarchy`) | Padres e hijas expandibles; ordenar por desviación |
| G-F | ¿A dónde se va mi ingreso? | **`Sankey`**: ingresos → gastos esenciales/discrecionales → deuda → ahorro → libre | Flujo del periodo (principios §19) | Solo el periodo elegido; en móvil alternativa en lista |
| G-G | ¿Cómo evoluciona mi patrimonio? | **`AreaChart` apilada** (activos arriba, pasivos abajo) + línea de patrimonio neto | `getFinancialEvolution`, historial de saldos | Rango 1M/3M/6M/1A; elegir cuentas; `Brush` para zoom |
| G-H | ¿Cómo va cada cuenta? | **`LineChart` con una serie por cuenta** | `getAccountBalanceHistory` | Alternar cuentas; elegir moneda/tipo |
| G-I | ¿Mi deuda baja? ¿Cuándo termino? | Líneas por deuda + área de total + marca del mes de liquidación | `getDebtOverview` | Elegir deuda; ver con y sin pago extra |
| G-J | ¿Mi ahorro crece? | `ComposedChart`: barras de ahorro + **línea de tasa de ahorro en eje secundario** | Datos de ahorro del Resumen | Mensual/quincenal |
| G-K | ¿Voy bien con mis metas? | **`RadialBarChart`** (anillos por meta) o barras de progreso con fecha proyectada | `getGoalProjections` | Elegir metas |
| G-L | ¿Mi saldo futuro alcanza? | `AreaChart` con **banda de escenario**, `ReferenceLine` del saldo mínimo y `ReferenceArea` donde cae por debajo | `getCashProjection`, `projectBalance` | Escenarios "¿qué pasa si…?", horizonte 30/60/90 días |
| G-M | ¿Qué cambió y por qué? | **Cascada (waterfall)**: del periodo anterior al actual por categoría (se arma con `BarStack` y una barra base invisible) | `composeComparison` / `ExplorerDriver` | Clic en una barra baja a sus movimientos (principios §30) |
| G-N | ¿Gasto en esenciales o en discrecionales? | Barra apilada al 100% o `RadialBar` | Naturaleza del gasto | Por periodo |
| G-O | ¿Cómo evolucionan mis categorías contra su promedio? | **Mini gráficas (small multiples)** por categoría con `ReferenceLine` del promedio de 3 meses | `getCategoryStats` | Ordenar por cambio |
| G-P | ¿Qué gasto es inusual / hormiga? | `ScatterChart` (día × monto, tamaño por frecuencia con `ZAxis`) con banda del rango habitual | Movimientos | Marcar anomalías (principios §24, §26) |
| G-Q | ¿Cuánto cuestan mis suscripciones? | Barras horizontales + total anual acumulado | Suscripciones por servicio | Fusionadas y por servicio |

## Interacciones y filtros comunes

Todas las gráficas deberían compartir el mismo conjunto de controles (los que apliquen):

- **Rango** como pestañas (7D / 30D / 90D / 12M, patrón del template de HeroUI Pro) y **granularidad** día/semana/mes.
- **Series**: leyenda clicable o `ToggleButtonGroup`; máximo ~6 series visibles y el resto agrupado en "Otras".
- **Comparar** con el periodo anterior (interruptor).
- **Filtros** de cuentas, categoría, comercio y naturaleza, reutilizando `FilterBar`/`FilterPill` (C-08).
- **Zoom** con `Brush` en series largas.
- **Drill-down**: clic en barra, segmento o punto filtra la gráfica o abre la lista de movimientos que lo componen.
- **Tooltip unificado**: fecha, todas las series, diferencia contra el periodo anterior.

## Accesibilidad y calidad

- `role="img"` con `aria-label` descriptivo y **tabla alternativa** (patrón que ya existe en `LineEvolutionChart`).
- No depender solo del color: etiquetas directas o patrones; paleta apta para daltonismo.
- Respetar `prefers-reduced-motion`; hoy las animaciones están apagadas.
- Estados completos: vacío con explicación, carga con `Skeleton` con la forma de la gráfica, error.
- Un tamaño mínimo de datos por tipo de gráfica: con 1 solo punto se muestra un mensaje en vez de una barra enorme.
- Legibilidad a 320 px: Sankey y Treemap pasan a lista o a un tipo más simple en móvil.

## Arquitectura propuesta (clean + atomic + HeroUI)

- **Dominio:** funciones puras que arman las series y las estructuras (`composeStackedSeries`, `netSeries`, jerarquía para Treemap, nodos y enlaces para Sankey, pasos de cascada, presupuesto contra real). Con pruebas unitarias. Sin importar Recharts.
- **Aplicación:** casos de uso que devuelven las series listas para graficar (ampliar `GetExplorer`, `GetFinancialEvolution`, etc.). Sin lógica visual.
- **UI** (`src/components/charts/`):
  - *Tema* `chartTheme`: colores por semántica de dinero (D-12) y por categoría, ejes, fuentes, formatos y modo oscuro mediante variables CSS.
  - *Moléculas:* `ChartTooltip`, `ChartLegend`, `ChartEmpty`, `ChartSkeleton`, `ChartRangeTabs`.
  - *Organismos:* `TimeSeriesChart` (barras, línea, área y compuesto con una **configuración declarativa de series** `{ key, label, kind, tone, axis, stack }`), `CategoryShareChart` (dona, treemap, sunburst), `BudgetVsActualChart`, `FlowSankeyChart`, `WaterfallChart`, `ProjectionChart`.
  - *Contenedor:* `ChartCard` sobre `Card` de HeroUI: título, descripción, controles (pestañas, filtros), la gráfica y la tabla accesible.
- **Rendimiento:** carga diferida con `next/dynamic` y `ChartSkeleton`, para no cargar Recharts en pantallas sin gráficas; los cubos (`bucket`) limitan los puntos; memoizar series.
- **Pruebas:** dominio con `node:test`; e2e comprueba `aria-label`, tabla alternativa y filtros; capturas para revisión visual.
- Con esto se pueden **retirar** `LineEvolutionChart` (SVG a mano) y las barras dibujadas con `div` en `ExplorerBreakdown`/`NatureBreakdownCard`.

## Dónde iría cada gráfica

- **Resumen:** una sola gráfica principal (G-G patrimonio o G-A ingresos y gastos, con pestañas) y G-F (Sankey) bajo demanda. Principio del documento `principios.md` §28: no mostrar todas a la vez.
- **Gasto por categoría:** G-B, G-C, G-D, G-O y G-N.
- **Presupuestos:** G-E arriba de la tabla.
- **Cuentas:** G-H (varias cuentas) y G-G.
- **Metas:** G-K.
- **Proyección:** G-L con escenarios.
- **Recurrentes y suscripciones:** G-Q.
- **Análisis de cambios y anomalías:** G-M y G-P.

## Riesgos y decisiones

- Más tipos de gráfica no es mejor por sí mismo: cada una debe responder una pregunta (principios §28).
- Sankey y Treemap se leen mal en pantallas pequeñas; necesitan alternativa.
- Con pocos datos varias gráficas se ven vacías: definir mínimos y mensajes.
- Peso del paquete de Recharts: carga diferida.
- La paleta para categorías: usar el color que el usuario ya asigna a cada categoría, con respaldo accesible.
- Decidir con el usuario cuáles de G-A a G-Q se hacen primero (Q-10).
