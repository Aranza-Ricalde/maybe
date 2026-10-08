# Rediseño: plan de la Fase 1

Alcance: Navegación, Resumen, Cuentas, Estadísticas (fusiona Gasto + Proyección) y Configuración.
No se tocan: Recurrentes, Importar, Presupuestos, Movimientos, Metas (solo enlaces y tokens compartidos).

## 1. Mapa de datos

### Resumen (`/`)
| Hoy | Después |
|---|---|
| Saludo + selector de periodos + "Registrar movimiento" | Se queda (cabecera compacta) |
| Disponible para gastar + estado financiero + runway | **Protagonista**: número grande + estado en una línea |
| KPIs: saldo total, deuda, ahorros, patrimonio | Se van a **Cuentas** (ya tiene lo que tienes / lo que debes / patrimonio). En Resumen queda una línea con enlace "Ver cuentas" |
| KPI tasa de ahorro | **Estadísticas** (franja de métricas) |
| Explorador (5 vistas, filtros) | Se disuelve en **Estadísticas** |
| Por revisar: Qué cambió / Recurrentes sugeridos / Coincidencias | Se queda como lista corta de lo accionable (solo con pendientes). "Qué cambió" pasa a ser la comparación de Estadísticas; en Resumen solo se muestran los avisos de insights |
| Calendario del periodo (por pagar / pagado, con acciones) | Lista "Próximos" (siguientes 7 entradas) con las mismas acciones; calendario completo queda como "Ver todo" en un sheet |
| (nuevo) Gráfica del mes: gasto acumulado vs ritmo del presupuesto | Zona protagonista. Datos: gasto diario (explorador) acumulado + presupuesto total del periodo (presupuestos). Sin columnas nuevas |

### Cuentas (`/accounts`)
| Hoy | Después |
|---|---|
| Totales (tienes / debes / neto) | Franja en línea |
| Tabla de cuentas | Lista agrupada por tipo, con sparkline de 30 días y utilización en crédito (límite y usado ya existen) |
| Gráfica "Saldo de tus cuentas" (nueva de esta sesión) | Se elimina: vive en Estadísticas (métrica Saldo, agrupar por cuenta) |
| Movimientos por cuenta + gráfica de saldo | Detalle de cuenta en sheet (gráfica de saldo + movimientos paginados) |
| Archivadas, crear/editar/eliminar | Se quedan (menú de la fila y botón) |

### Estadísticas (`/stats`, reemplaza `/spending` y `/projection`)
| Hoy | Después |
|---|---|
| Gasto: promedio mensual, último mes vs anterior, categorías con gasto | Franja de métricas |
| Gasto: gráfica apilada por categoría | Gráfica principal, agrupar por categoría (apilada) |
| Gasto: tabla por categoría (meses, promedio, delta, %) | Tabla sincronizada (en móvil, lista) |
| Gasto: aviso esencial vs discretionary | Nota bajo la tabla |
| Gasto: Comercios / Suscripciones / Gastos pequeños | Pestañas bajo la tabla (las suscripciones conservan fusionar/disolver) |
| Explorador: flujo, por categoría, por comercio, saldo, qué cambió | Gráfica principal: métricas, agrupación y comparación |
| Explorador: filtros cuenta / categoría / comercio / tipo de gasto | Barra de filtros (sheet en móvil), en la URL |
| Proyección de caja a N días + estado + saldo mínimo | Métrica Saldo con tramo proyectado punteado; saldo mínimo como línea de referencia editable; estado en la franja |
| Proyección: lista de movimientos esperados | Colapsable bajo la gráfica cuando la proyección está activa |
| Simulador de escenarios (recortes, ingresos, deuda) | Panel "Simular" (sheet): dibuja el escenario como segunda línea punteada en la misma gráfica |
| Gráficas de esta sesión: dona, apilado, cascada, líneas por cuenta | Se absorben (ver §3); dona y cascada pasan a ser modos de la gráfica |

### Lo que NO soporta el modelo (no lo invento)
- **Agrupar por cuenta** solo existe para la métrica Saldo (el explorador filtra por cuenta pero no agrupa gasto por cuenta). Para gasto/ingreso por cuenta se usa el filtro.
- **Proyección** de gasto e ingreso por categoría no existe; la proyección diaria existe solo para Saldo (caja). El simulador proyecta saldo y patrimonio mensual.
- **Comparación con el periodo anterior**: hoy el explorador solo devuelve totales y causas del cambio. La serie del periodo anterior se obtiene ejecutando la misma consulta con el rango anterior (sin cambios de esquema).
- **Fecha de pago de tarjeta**: no la he visto en lo que leí; solo muestro utilización. Lo verifico en Fase 4 y, si no existe, no se muestra.
- **Zona de peligro** en Configuración: solo si existe alguna acción destructiva real; lo verifico en Fase 5.

## 2. Wireframes

### Navegación
```
Desktop (colapsable a íconos)        Móvil (barra inferior)
┌ Maybe        [«] ┐                 Resumen · Movim. · Estadíst. · Presup. · Más(drawer)
│ RESUMEN          │                 "Más": Cuentas, Recurrentes, Metas,
│  ● Resumen       │                        Importar, Configuración
│ DINERO           │
│  Cuentas         │   (el grupo y el ítem activo resaltan)
│  Movimientos     │
│  Importar        │
│ PLANEACIÓN       │
│  Presupuestos    │
│  Recurrentes     │
│  Metas           │
│ ANÁLISIS         │
│  Estadísticas    │
│ SISTEMA          │
│  Configuración   │
└──────────────────┘
```
10 ítems pasan a 10 (menos Gasto y Proyección, más Estadísticas = 9).

### Resumen
```
Desktop                                         Móvil
Buenas tardes, Rafa        [+ Registrar]        Buenas tardes, Rafa
29 sep – 29 oct  [Cambiar periodo]              [+ Registrar]
┌───────────────────────────────────────────┐   DISPONIBLE PARA GASTAR
│ DISPONIBLE   $114,180   ● te alcanza      │   $114,180   ● te alcanza
│ ┌ gráfica: gasto acumulado vs ritmo ────┐ │   [gráfica acumulado vs ritmo]
│ └───────────────────────────────────────┘ │   Gastado · Presupuesto · Quedan N días
│ Gastado $6,601 · Presupuesto $6,328 · 20d │   POR REVISAR (solo si hay)   [3]
└───────────────────────────────────────────┘   PRÓXIMOS
 POR REVISAR (3)          PRÓXIMOS                Netflix  10 oct  $229 [Pagar]
 · Recurrente sugerido    10 oct Netflix  $229    ...
 · Coincidencia           13 oct Seguro   $850   Ver cuentas →  Ver estadísticas →
 Ver cuentas →  Ver estadísticas →
```

### Cuentas
```
Tienes $121,526 · Debes $3,800 · Neto $117,726        [Ver archivadas] [+ Nueva]
EFECTIVO Y DÉBITO
 Nu Débito   Cuenta de cheques   ~~sparkline~~   $115,859   ⋮
 Nu Ahorro   Ahorro              ~~sparkline~~   $5,666     ⋮
CRÉDITO
 Nu TDC      ▓░░░░ 2% de $50,000                 $800       ⋮
PRÉSTAMOS
 Préstamo Auto                                   $3,000     ⋮
Clic en fila → sheet: gráfica de saldo (rango) + movimientos. En móvil: lista de dos líneas.
```

### Estadísticas
```
Desktop
Estadísticas                                   [Periodo ▾ Últimos 6 m] [Comparar ◻] [Filtros]
Promedio mensual $3,659 · Último vs anterior +$6,478 (+432%) · Tasa de ahorro 3% · ● Estado
Métrica: (Gasto)(Ingreso)(Neto)(Saldo)   Agrupar: (Tiempo)(Categoría)(Comercio)(Cuenta*)  Proyección ◉  [Simular]
┌───────────────────────────────────────────────────────────────┐
│  gráfica principal (barras apiladas / líneas, real + punteado) │
└───────────────────────────────────────────────────────────────┘
Tabla sincronizada [buscar…]            ordenar por ▾
 Categoría  may jun jul ago sep oct  Prom  Δ vs ant  %      → clic filtra gráfica y tabla
 ...                                                         → "Ver movimientos" abre /transactions con el filtro
[Comercios] [Suscripciones] [Gastos pequeños]

Móvil: franja en 2 filas · controles en scroll horizontal de chips · Filtros = sheet ·
       gráfica a ancho completo (altura 240) · tabla → lista de tarjetas planas de dos líneas
```
(*) solo con la métrica Saldo.

### Configuración
```
Desktop: menú lateral interno      Móvil: pestañas desplazables
 Cuenta        │ Título + descripción breve
 Apariencia    │ ─ formulario ─
 Integraciones │ [Guardar]  (toast de confirmación)
 Categorías    │
 Periodos      │
 (Peligro, si existe)
```

## 3. Sistema de diseño

**Tokens (revisar en Fase 2 contra `globals.css` y las pantallas que no cambian):**
espaciado: `gap-6` entre secciones, `gap-4` dentro; radio único `rounded-xl` para contenedores y `rounded-md` para controles; color solo con significado (`--success` ingreso/ahorro, `--danger` gasto/alerta, `--warning`, `--chart-*` series, proyección = mismo color de la serie en punteado + área sombreada).

**shadcn a agregar:** ninguno nuevo previsto; ya existen `sidebar`, `sheet`, `tabs`, `toggle-group`, `chart`, `skeleton`, `table`, `calendar`, `collapsible`, `empty`. Si el simulador lo necesita, `slider`.

**Compartidos nuevos:**
- `TimeSeriesChart`: una sola gráfica cartesiana (barras/líneas/área, apilada, series con tramo proyectado, línea de referencia, tabla alterna accesible). Reemplaza `LineEvolutionChart`, `ExplorerFlowChart`, `ProjectionBalanceChart`, `SpendingStackedChart` y `AccountsBalanceChart`.
- `MetricStrip`: franja de métricas en línea (reemplaza `StatBlockRow`/`DashboardKpiRow` en las pantallas rediseñadas).
- `DataList`: tabla en desktop, lista de dos líneas en móvil.
- `Sparkline`: mini línea sin ejes.
- `SettingsNav`: menú lateral / pestañas.
- `NavGroup` en el sidebar.

Se conservan `ShareDonutChart` y `ExpenseWaterfallChart` como modos de la gráfica (agrupar por categoría con dona; comparar con cascada) y `GoalRingsChart` en Metas (no se toca).

## 4. Arquitectura

```
domain/stats/
  params.ts        parseStatsParams / serializeStatsParams (zod; metric, group, range, compare, filtros, orden)
  series.ts        netSeries, cumulative, stackedByGroup, mergeProjection (puras, con tests)
  pace.ts          ritmo esperado del presupuesto para el Resumen (pura)
application/
  getStats.ts      compone explorador + proyección de caja + estadísticas por categoría + periodo anterior
  getDashboardPage.ts  (se recorta: sin explorador ni KPIs de cuentas, con serie acumulada)
hooks/
  useStatsParams.ts   lee/escribe la URL (router.replace, sin recargar)
  useStatsData.ts     carga con transición + caché por clave de parámetros
components/organisms/
  StatsToolbar, StatsChart, StatsTable, StatsAnalysisTabs, ScenarioSheet
  AccountsList, AccountDetailSheet, DashboardHero, UpcomingList
  SettingsNav
app/(app)/stats/page.tsx   (+ actions.ts)
```
**Rutas:** `/stats` nueva; `/spending` y `/projection` redirigen 308 a `/stats` (en `next.config.ts`), con `?m=` según el origen (`/projection` → métrica Saldo con proyección activa). Constantes en `domain/shared/routes.ts`.

**Datos:** no hay cambios de esquema. El explorador existente es la fuente de series, categorías, comercios, saldo y comparación; las estadísticas por categoría alimentan la tabla; la proyección de caja alimenta el tramo punteado.

## 5. Orden de implementación
1. **Fase 2 Base:** tokens, `NavGroup`/sidebar agrupado y barra inferior con "Más", `MetricStrip`, `DataList`, `Sparkline`, `TimeSeriesChart`.
2. **Fase 3 Estadísticas:** dominio + tests, `getStats`, hooks, página, redirects.
3. **Fase 4 Resumen y Cuentas.**
4. **Fase 5 Configuración.**
5. **Fase 6 Limpieza:** borrar `ExplorerCard`, las 5 gráficas duplicadas, `SpendingPageTemplate`, `CashProjectionCard`/`ProjectionSimulator` (migrados), actualizar e2e y docs; revisión a 375/768/1280, claro/oscuro, vacío/carga/error.

## 6. Estado de la implementación

Hecho: navegación agrupada (barra inferior con 5 destinos y "Más"), Resumen, Cuentas, Estadísticas (reemplaza Gasto y Proyección; `/spending` y `/projection` redirigen) y Configuración con menú interno.

Diferencias respecto al plan, y por qué:
- **Simulador**: vive en una hoja lateral y dibuja su propia gráfica mensual. No se superpone a la gráfica diaria de saldo porque la proyección de caja es diaria y el simulador es mensual.
- **Dona y cascada** se retiraron. "Comparar" muestra las barras del periodo anterior junto a las actuales; las causas del cambio siguen en el aviso de Resumen.
- **Tabla de categorías**: muestra tendencia, total, porcentaje y variación contra el periodo anterior (la variación solo existe para las 5 categorías que más cambiaron). El detalle mes a mes con promedio de 3 meses sigue disponible en un desplegable.
- **Colores**: las series por categoría usan el color de cada categoría.
- **Configuración**: la sección activa vive en la dirección (`?s=periodos`).
- **Deuda**: el detalle (tasa, pago mínimo, fecha de vencimiento, liquidación) pasó al detalle de cada cuenta; los KPIs de saldo, deuda y ahorros salieron del Resumen (Cuentas ya tiene lo que tienes, lo que debes y el patrimonio).
- **Fecha de pago de tarjeta**: sí existe (`paymentDueDay`) y se muestra en la lista de cuentas.

Datos nuevos sin cambios de esquema: serie apilada por categoría y serie del periodo anterior en el explorador, ritmo de gasto acumulado (`domain/dashboard/pace.ts`), parámetros de Estadísticas en la URL (`domain/stats/params.ts`).
