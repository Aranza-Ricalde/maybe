# Auditoría de diseño — octubre 2026

Auditoría de solo lectura hecha con la skill `design-audit` (`.claude/skills/design-audit`), con capturas reales y análisis de código. Fecha: 2026-10-07. Estado del código auditado: commit `3369bac`.

La dirección de referencia es la de la skill: sobria, precisa, "estado de cuenta bien diseñado" (Mercury, Monarch, Copilot, Linear). Principios clave: el número manda, las superficies se ganan (menos cards), el color significa algo, consistencia semántica, móvil como ciudadano de primera.

## Método y límites

- **Stack detectado:** Next 16.3.8, React 19.2.8, HeroUI **v3.2.6** (`@heroui/react` y `@heroui/styles`), Tailwind **4** con tema en CSS (`src/app/globals.css`, sin `tailwind.config`), Recharts 3.10, `@gravity-ui/icons`, Geist y Geist Mono con `next/font`. La skill asume `tailwind.config` con el plugin `heroui()`; se adaptó el criterio a tokens CSS.
- **Capturas:** 132 (11 pantallas × 6 anchos × 2 modos) con Chrome headless por protocolo de depuración, sobre la base e2e de demostración (no datos reales). Más 7 capturas altas (1440×3000) y 2 de "oscuro real" forzando `data-theme="dark"`. Evidencia en [`capturas/`](./capturas) y métricas en [`capturas/metricas-responsive.json`](./capturas/metricas-responsive.json).
- **Limitaciones:**
  - El contenido vive en un `<main>` con scroll propio; las capturas de 375/320 cubren solo el primer viewport.
  - Las capturas "oscuras" por `prefers-color-scheme` salen claras (ver hallazgo D-02), no sirven para evaluar el oscuro; para eso se forzó `data-theme="dark"` en 2 pantallas.
  - 1920 px solo se verificó por métricas (sin desborde), no visualmente.
  - Gráficas de Recharts no se evaluaron en móvil.
  - Contraste exacto (AA) de textos secundarios: NO VERIFICADO.
  - Estados hover/focus/disabled y teclado: NO VERIFICADO.
- **Conteos de `grep`** (cards, usos de componentes) son orientativos.

## Resumen ejecutivo

- **Calificación global: 2.5 / 5.** En escritorio la app se ve sobria y ordenada; en móvil es inutilizable.
- Pantallas auditadas: 11 de 11 (login, Resumen, Cuentas, Movimientos, Presupuestos, Gasto por categoría, Recurrentes, Proyección, Metas, Configuración, Importar).
- Hallazgos de diseño: 2 críticos, 6 altos, 6 medios y 9 de UX por pantalla (ver [`backlog-diseno.md`](./backlog-diseno.md)).

## Matriz pantalla por breakpoint

| Pantalla | 320 | 375 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| /login | OK | OK | OK | OK | OK | OK |
| Resumen, Importar | PROBLEMAS | PROBLEMAS | OK | OK | OK | NO VERIFICADO |
| Cuentas, Movimientos, Presupuestos, Recurrentes, Metas, Configuración | PROBLEMAS | PROBLEMAS | PROBLEMAS (tablas) | OK | OK | NO VERIFICADO |
| Gasto por categoría | PROBLEMAS | PROBLEMAS | PROBLEMAS | PROBLEMAS (tabla de 960 px) | OK | NO VERIFICADO |

Notas de la matriz: en 768 el menú de 240 px deja 528 px de contenido y las tablas con `min-w` de 640 a 960 px hacen scroll horizontal interno. El desborde de **página** fue 0 en todos los casos porque el scroll vive dentro de `<main>`; el desborde real es interno.

## Hallazgos responsive

1. **CRÍTICO — No hay navegación móvil.** `AppShell.tsx` (`flex h-screen`) y `AppSidebar.tsx` dejan el menú de **240 px fijo en todos los anchos** (medido a 320, 375 y 768). A 375 px el contenido útil mide 135 px y la columna de página 87 px (padding de 24 px por lado): los títulos se parten letra por letra y los botones se cortan. `main` hace scroll horizontal interno (`scrollWidth` hasta 556 px en Configuración). Corrección: barra inferior de 4 destinos y hoja "Más" en móvil; menú lateral solo desde `md`.
2. **ALTO — 10 tablas con anchos mínimos fijos y sin versión de lista:** `PayPeriodsTable` (420), `PayMonthsTable` (420), `TransactionsExplorer` (680), `RecurringItemsTable` (820), `CategoriesTable` (520), `DataTable` (480), `CategoryStatsTable` (960), `AccountsTable` (640), `BudgetsTable` (640), `GoalsTable` (760). Corrección: renderer de fila tipo lista en móvil.
3. **ALTO — Modales centrados en vez de drawers/bottom sheets.** 37 archivos usan Modal y 0 usan Drawer. Solo `FormModal` y `DetailModal` tocan el modal de HeroUI; más de 15 modales cuelgan de ellos.
4. **ALTO — Inputs con fuente menor a 16 px** (zoom de iOS), a 375 px: Recurrentes 7, Movimientos 2, Cuentas 2, Configuración 2, Metas 1.
5. **ALTO — Áreas táctiles menores a 44 px** (375 px, claro): Movimientos 82/83, Resumen 44/57, Presupuestos 39/39, Gasto 39/55, Recurrentes 33/33, Configuración 46/47, Cuentas 25/30, Proyección 20/22, Metas 17/17, Importar 13/13, Login 3/3.
6. **MEDIO — Técnico:** `h-screen` en `AppShell` (usar `dvh`), sin safe areas, sin `prefers-reduced-motion`, 23 reglas `hover:` por revisar (¿alguna acción solo existe con hover?).

## Hallazgos de calidad visual

1. **CRÍTICO — El modo oscuro está roto.** `globals.css` (líneas 26-37) cambia solo el acento a `#2dd4bf` bajo `prefers-color-scheme: dark`, pero las superficies de HeroUI siguen claras: enlaces turquesa pálido sobre blanco (contraste cercano a 1.7:1). El tema oscuro real existe con `data-theme="dark"` pero ningún control lo activa; al forzarlo, el fondo es casi negro puro (L≈1.5) y el rojo de "2 categorías se pasaron" casi no se lee.
2. **ALTO — Avisos de "por revisar" sin un patrón único.** `CaptureReviewBanner`, `TransferReviewBanner`, `RecurringBudgetDecisionBanner`, `ReviewAlert` y `FinancialStatusBanner`, más 7 cajas de color ad hoc. El banner de decisión de presupuesto aparece igual en Presupuestos y Recurrentes.
3. **ALTO — Mensajes contradictorios en Resumen:** el aviso rosa "Podrías terminar el periodo por encima de tu presupuesto" aparece sobre la tarjeta verde "A tu ritmo actual, te alcanza hasta el fin del periodo".
4. **MEDIO — Demasiadas cards.** Resumen ~17, Proyección ~21, Configuración ~20 elementos `.card` (incluye subpartes, sobrestima); `SettingsPageTemplate` usa 16 `Card`.
5. **MEDIO — Más de un botón primario por contexto:** Resumen 3, Recurrentes 3.
6. **MEDIO — Tema parcial:** acento y success/warning/danger definidos, pero sin semánticos de dinero (ingreso, gasto, deuda, ahorro, alerta). Valores arbitrarios (`text-[10px]` ×2, `text-[11px]`), radios mezclados (`rounded-full` 29, `rounded-lg` 20, `rounded-xl` 7, `rounded-2xl` 5, `rounded-field` 2) y 6 sombras sueltas.
7. **MEDIO — Un solo `loading.tsx`** (`PageSkeleton` genérico) para toda la app; sin skeletons con la forma de cada pantalla.

## UX por pantalla (resumen; detalle y lista de tareas en el backlog)

- **Resumen:** KPIs desiguales ("Ver detalle →" se parte en 2 líneas en Deuda; 4 iconos (i)); gráfica del Explorador ocupa mucho espacio con 1 sola barra de datos; la pestaña "Qué cambió" de "Por revisar" es un insight, no un pendiente; el calendario trae 3 botones de peso similar por fila (Elegir movimiento, Marcar pagado, Omitir).
- **Gasto por categoría:** lo primero es el mismo Explorador del Resumen (duplicado) y la tabla de categorías, que da nombre a la pantalla, queda hasta abajo; 11 tablas en el DOM; contadores sin sentido en pestañas ("Comercios (1)").
- **Movimientos:** la fecha completa se repite en cada fila (conviene agrupar por día); 3 iconos de acción por fila; sin resumen de filtros activos.
- **Presupuestos:** la mejor cuidada; 14 iconos (i) (2 por fila) meten ruido; el chip "Se pasó · 120%" repite lo que dice la barra roja; el banner de decisión se repite en Recurrentes.
- **Cuentas:** "Mostrar 10" y contador aparecen con 4 filas; la gráfica no tiene ejes.
- **Recurrentes:** 3 bloques apilados antes de la tabla (decisión de presupuesto, posibles recurrentes, nota "Como presupuesto"); cada fila trae 2 interruptores y el segundo dice "Sin decidir" con el interruptor encendido (contradictorio).
- **Proyección:** buena (lista de eventos y saldo proyectado); el enlace "Cambiar ($0)" es poco claro.
- **Metas:** el fondo de emergencia muestra un guion enorme; el texto "Al ritmo actual" ocupa 3 líneas densas.
- **Configuración:** 7 cards apiladas con temas sin relación; "Cómo ver tus periodos" queda muy abajo; el bloque del token parece técnico (POST a localhost en monoespaciado).
- **Login:** tarjeta centrada con logo (aspecto genérico según la skill), sin botón para ver la contraseña.
- **Importar:** referente interno; ver "Lo que está bien logrado".

## Calificaciones por pantalla (1 a 5)

| Pantalla | Responsive | Jerarquía | Tipografía | Espaciado | Color | Consistencia | Refinamiento |
|---|---|---|---|---|---|---|---|
| Login | 4 | 3 | 4 | 4 | 4 | 3 | 3 |
| Resumen | 1 | 4 | 4 | 4 | 3 | 3 | 3 |
| Cuentas | 1 | 3 | 4 | 4 | 4 | 4 | 3 |
| Movimientos | 1 | 3 | 4 | 4 | 4 | 4 | 3 |
| Presupuestos | 1 | 4 | 4 | 4 | 4 | 4 | 4 |
| Gasto | 1 | 3 | 4 | 4 | 4 | 3 | 3 |
| Recurrentes | 1 | 3 | 4 | 4 | 4 | 3 | 3 |
| Proyección | 1 | 4 | 4 | 4 | 4 | 4 | 3 |
| Metas | 1 | 3 | 4 | 3 | 4 | 3 | 3 |
| Configuración | 1 | 3 | 4 | 3 | 4 | 3 | 3 |
| Importar | 2 | 4 | 4 | 4 | 4 | 4 | 4 |

Justificación de las menores a 4: responsive 1 por el menú fijo; jerarquía 3 donde compiten varias cards o botones del mismo peso; color 3 en Resumen por los semánticos genéricos y el aviso rosa; espaciado 3 en Metas y Configuración por bloques desbalanceados; refinamiento 3 por estados de carga genéricos y el modo oscuro roto.

## Densidad de cards y botones (escritorio, 1440 px)

Los conteos de cards incluyen subpartes (cabecera, contenido) y sobrestiman. Los botones incluyen iconos.

| Pantalla | Elementos card | Botones primarios | Botones | Tablas |
|---|---|---|---|---|
| Resumen | 17 | 3 | 38 | 0 |
| Cuentas | 5 | 1 | 16 | 3 |
| Movimientos | 1 | 1 | 68 | 1 |
| Presupuestos | 0 (tabla propia, sin Card) | 1 | 29 | 1 |
| Gasto | 16 | 0 | 27 | 11 |
| Recurrentes | 6 | 3 | 16 | 1 |
| Proyección | 21 | 1 | 9 | 1 |
| Metas | 2 | 1 | 6 | 1 |
| Configuración | 20 | 2 | 34 | 2 |
| Importar | 1 | 1 | 3 | 0 |

## Lo que está bien logrado (conservar)

- **Importar (referente interno).** Zona de arrastre con jerarquía en 3 niveles de texto, nota de privacidad, 3 pasos numerados que solo aparecen cuando no hay archivos, revisión con pestañas explicadas, lista con divisores y barra de confirmación al pie. El usuario lo señaló como el estilo que quiere en toda la app.
- **Resumen:** "Disponible para gastar" como cifra héroe y KPIs con divisores.
- **Tipografía:** Geist con `tabular-nums` en cifras.
- **Presupuestos:** tabla semántica con árbol colapsable, barras delgadas y tooltips de origen y descripción.
- **Accesibilidad básica:** `aria-label` en botones de icono, tablas con encabezados semánticos.
- **Login:** limpio y funcional hasta 320 px.
- **Arquitectura:** el 100% de los modales cuelga de 2 bases (`FormModal`, `DetailModal`), lo que hace barato cambiar a un diálogo responsivo.

## Preguntas abiertas

Ver [`README.md`](./README.md#decisiones) (tabla de decisiones con estado).
