# Diseño y componentes — índice

Todo lo que se ha analizado sobre el diseño de Maybe, para no perder nada. Última actualización: 2026-10-07.

| Documento | Contenido |
|---|---|
| [`auditoria-2026-10.md`](./auditoria-2026-10.md) | Auditoría con la skill `design-audit`: método, matriz por breakpoint, hallazgos, calificaciones, densidad de cards, lo que está bien. |
| [`catalogo-componentes.md`](./catalogo-componentes.md) | Análisis de código: duplicación, catálogo atómico objetivo y mapeo a componentes de HeroUI. |
| [`referencias-heroui.md`](./referencias-heroui.md) | Templates de HeroUI Pro de referencia, patrones aplicables y componentes HeroUI disponibles. |
| [`migracion-shadcn.md`](./migracion-shadcn.md) | **Decisión vigente:** migrar de HeroUI a shadcn/ui por fases; datos verificados, puente de tokens, mapa de componentes y riesgos. |
| [`graficas.md`](./graficas.md) | Recharts: estado actual, qué ofrece la versión instalada, mapa de datos a gráficas (G-A a G-Q), interacciones, arquitectura y dónde iría cada una. |
| [`backlog-diseno.md`](./backlog-diseno.md) | Lista de tareas con ID (`D-`, `U-`, `C-`, `G-`, `I-`) y estado. Es la fuente para ir marcando avances. |
| [`capturas/`](./capturas) | Evidencia: capturas (base e2e de demostración, sin datos reales) y métricas de responsive. |

## Principios acordados

1. **shadcn/ui primero** (decisión 2026-10-07; antes fue "HeroUI primero", y MUI se evaluó y descartó): usar los primitivos de `src/components/ui/` siempre que existan; componentes propios solo si agregan algo de la app. Ver [`migracion-shadcn.md`](./migracion-shadcn.md).
2. **El estilo de la pantalla Importar** es el referente interno (jerarquía en 3 niveles, ayuda corta, pasos, listas con divisores, bordes finos). El usuario quiere llevarlo a toda la app.
3. **Móvil de primera clase**, con tema claro y oscuro coherentes.
4. **Clean architecture y atomic design:** la UI solo cambia en `src/components`, `src/app` y `src/lib` de presentación; dominio y aplicación no se tocan.
5. Dirección de la skill: el número manda, las superficies se ganan (menos cards), el color significa algo, consistencia semántica.

## Decisiones

| ID | Pregunta | Estado |
|---|---|---|
| Q-01 | ¿Aplicar el estilo de Importar como línea general (bordes finos, ayuda corta, pasos, divisores) y reservar las cards para objetos reales? Tensión con "menos cards" de la skill. | El usuario dijo que le encanta Importar y lo quiere en toda la app; **falta confirmar** el balance con "menos cards". |
| Q-02 | ¿Fusionar el aviso rosa y el estado verde del Resumen en una sola voz de estado? | Pendiente |
| Q-03 | ¿Quitar el Explorador repetido de Gasto por categoría y dejar la tabla de categorías primero? | Pendiente |
| Q-04 | ¿Agrupar Movimientos por día (escritorio y móvil)? | Pendiente |
| Q-05 | ¿Dividir Configuración en secciones con subnav (Cuenta, Categorías, Periodos, Integraciones)? | Pendiente |
| Q-06 | ¿Modo oscuro real con interruptor, o quitarlo por ahora? | **Resuelta (2026-10-07):** el usuario delegó ("lo que veas mejor"); se hizo real con interruptor Sistema/Claro/Oscuro. |
| Q-07 | ¿Empezar por las fases 0 y 1 o por un mockup? | **Resuelta (2026-10-07):** se empezó por menú móvil y tema (D-01, D-02). |
| Q-08 | ¿Serif elegante solo para la cifra héroe, o seguir con Geist? (sugerencia de la skill) | Pendiente |
| Q-09 | Abrir los templates de referencia en navegador (escritorio y móvil) para validar decisiones visuales que la lectura de texto no mostró. | Pendiente |
| Q-10 | ¿Qué gráficas de `graficas.md` (G-A a G-Q) se priorizan primero? | Pendiente |
| Q-11 | ¿Aceptas que Sankey y Treemap tengan una alternativa en lista en móvil? | Pendiente |

## Decisión sobre gráficas (2026-10-07)

El usuario quiere usar **Recharts** y no limitarse a barras: gráficas más complejas con varias series y filtros. Ver [`graficas.md`](./graficas.md).

## Estándares de implementación (obligatorios en cada cambio)

1. **Clean architecture:** `domain` (reglas puras) → `application` (casos de uso) → `infrastructure`; la UI solo vive en `src/components`, `src/app` y `src/lib` de presentación. Lógica no trivial (por ejemplo `isNavActive`, `lib/theme.ts`) se extrae como función pura con pruebas unitarias, nunca dentro del componente.
2. **Atomic design + shadcn/ui primero:** átomos → moléculas → organismos → plantillas; usar el primitivo de shadcn/ui si existe; una sola fuente de verdad para datos de presentación (p. ej. `navItems.tsx` alimenta el menú lateral y la barra inferior).
3. **Sin duplicar:** antes de escribir un patrón, buscar si ya existe (`catalogo-componentes.md`); si aparece por segunda vez, se extrae como componente genérico.
4. **Sin comentarios en el código**, textos en español con ortografía completa.
5. **Validación en cada paso:** `tsc` (proyecto y `cypress/`), `eslint`, `npm run test:unit`, `next build`, suite e2e completa (con `reset:e2e` y `seed:e2e` previos; el puerto 3001 puede estar ocupado: servir con `next start -p 3011` y `--config baseUrl`), y **revisión visual real** con Chrome (capturas a 320/375/768/1440, claro y oscuro) y clics reales para interacciones.
6. **Cambios de esquema** solo con autorización explícita y SQL aditivo en `drizzle/manual/`, aplicado a producción y a las ramas e2e.
7. Actualizar `backlog-diseno.md` (casillas) y este índice al terminar cada pieza.

## Plan por fases

| Fase | Qué | Tamaño |
|---|---|---|
| 0 | (**hecho en parte**: modo oscuro real e interruptor) Tema: modo oscuro real con interruptor, semánticos de dinero, radios y espaciado, átomos base (`ProgressBar`, `Money`, `Skeleton`, `Text`) | M |
| 1 | (**hecho en parte**: `AppNav` móvil) `AppNav` (barra inferior móvil), `PageLayout`, `ResponsiveDialog` | M |
| 2 | Moléculas: `SectionCard`, `MetricBlock`, `ListRow`, `RowActions`, `Callout`, `FilterPill` | M |
| 3 | `DataTable` con modo lista y migración de las 10 tablas | L |
| 3b | Base de gráficas (`chartTheme`, `ChartCard`, `TimeSeriesChart`) y retiro del SVG a mano | M |
| 4 | Pantallas en orden: Movimientos, Presupuestos, Resumen, Cuentas, Recurrentes, Metas, Gasto, Proyección, Configuración, Login | L |

Cada fase termina con `tsc`, eslint, pruebas unitarias, build y la suite e2e en verde; los specs que dependan de estructura se actualizan en la misma fase.
