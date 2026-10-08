# Migración de HeroUI a shadcn/ui

Decisión del usuario (2026-10-07): **dejar HeroUI y migrar toda la app a shadcn/ui**. Historia de la decisión: HeroUI → (se evaluó MUI, descartado antes de instalar nada) → **shadcn/ui**. Motivo de salir de HeroUI: su `Sidebar` responsivo es un componente Pro (licencia + inicio de sesión con GitHub).

Con esta decisión, el principio de los documentos anteriores "HeroUI primero" pasa a ser **"shadcn/ui primero"**. Los patrones de [`catalogo-componentes.md`](./catalogo-componentes.md) siguen valiendo; la columna "base HeroUI" se lee ahora como "base shadcn/ui" según la tabla de abajo.

## Qué es shadcn/ui (y por qué encaja)

No es una librería cerrada: el CLI **copia el código** de cada componente a `src/components/ui/` (Radix UI + Tailwind + `class-variance-authority`). Es nuestro código, sin licencias ni versiones que se muevan. Encaja con lo que ya hay: Tailwind 4, React 19, Next App Router, Recharts 3.

Datos verificados en la documentación oficial (2026-10-07):

- **`Sidebar` gratis y responsivo de fábrica:** en móvil se vuelve un `Sheet`; modos `offcanvas`, `icon` y `none`; variantes `sidebar`, `floating` e `inset`; `SidebarProvider` y `useSidebar`; atajo `cmd/ctrl+b`.
- **`Chart` construido sobre Recharts v3** (`ChartContainer`, `ChartConfig`, `ChartTooltip`, `ChartLegend`): es la base de las gráficas ya planeadas en [`graficas.md`](./graficas.md); la tarea de "tema de gráficas" se resuelve con él.
- **Instalación:** `pnpm dlx shadcn@latest init` y `pnpm dlx shadcn@latest add <componente>`; crea `components.json`, `lib/utils.ts` y modifica `globals.css`; agrega `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` y `tw-animate-css`.
- Tiene `Sheet`, `Drawer`, `Dialog`, `Tabs`, `Toggle Group`, `Table`/`Data Table` (TanStack), `Calendar` con rango (`react-day-picker`), `Select`, `Form`, `Sonner`, `Skeleton`, `Progress`, `Alert`, `Badge`, `Tooltip`, `Command`, `Breadcrumb`… sin edición de pago.

## Convivencia temporal con HeroUI: puente de tokens

Ambas librerías usan nombres de variables CSS parecidos con significados distintos (`--accent`, `--muted`, `--border`, `--radius`). Para migrar por fases sin romper la app:

1. Las variables de shadcn se definen con prefijo propio (`--sc-*`) y los colores de Tailwind (`--color-background`, `--color-primary`, `--color-muted`, `--color-accent`…) se **reasignan a ellas** con `@theme inline`. HeroUI conserva sus variables intactas para sus propios componentes.
2. Un **codemod** reescribe las clases heredadas de HeroUI en `src/` a los nombres de shadcn (por ejemplo `bg-surface` → `bg-card`, `text-muted` → `text-muted-foreground`, `border-separator` → `border-border`, `text-accent` → `text-primary`, `bg-surface-secondary` → `bg-muted`) para que no haya colisión de significados. Los tonos de dinero extra (`success`, `warning`) se agregan como tokens propios.
3. El tema oscuro sigue activándose con `data-theme="dark"` (la cookie ya implementada); shadcn se ajusta con `@custom-variant dark (&:is([data-theme=dark] *))`.
4. Al terminar la migración, se renombra `--sc-*` a los nombres estándar y se elimina HeroUI.

## Capas atómicas con shadcn

- **`src/components/ui/`**: primitivos de shadcn (dueño: el CLI y nuestro ajuste). Se consideran la base de átomos y moléculas.
- **`src/components/atoms|molecules|organisms|templates/`**: se mantienen; componen los primitivos de `ui/` y agregan lo propio de la app (`Money`, `ListRow`, `MetricBlock`, `FilterBar`…). **No se envuelve un primitivo si no agrega nada.**
- `lib/utils.ts` (`cn`) es la única utilidad de clases; Tailwind se usa directamente (shadcn está hecho para eso).

## Fases

| Fase | Qué | Criterio de salida |
|---|---|---|
| **S0** | Fundaciones: `shadcn init`, puente de tokens, modo oscuro con `data-theme`, codemod de clases, componentes base (`button`, `card`, `badge`…) | `tsc`, eslint, unitarias, build, e2e y consola de desarrollo limpios; la app se ve igual |
| **S1** | **Shell:** `Sidebar` de shadcn (escritorio y `Sheet` móvil) + barra inferior móvil + hoja "Más" (`Drawer`); sustituye a `AppSidebar` y `BottomNav` | Navegación usable de 320 a 1920 px |
| **S2** | Átomos y moléculas: `Button`, `Badge`, `Input`, `Select`, `Switch`, `Tooltip`, `Alert`, `Skeleton`, `Progress`, `Tabs`/`Toggle Group`, `Sonner` para notificaciones, `Money`, `SectionCard`, `MetricBlock`, `ListRow`, `RowActions` | Sin duplicados de barra de progreso ni de aviso |
| **S3** | Diálogos y formularios: `ResponsiveDialog` (`Dialog` en escritorio, `Drawer` inferior en móvil) y los ~15 modales | Una sola base de diálogo |
| **S4** | Tablas y listas: `Table`/Data Table con modo lista en móvil; `Calendar` en rango para periodos y filtros de fecha | Sin scroll horizontal de página en móvil |
| **S5** | Pantallas, una por una, con el estilo de Importar | Verificación visual a 320/375/768/1440, claro y oscuro |
| **S6** | Gráficas con `Chart` de shadcn (Recharts v3) según `graficas.md`, y retiro de HeroUI, react-aria y Gravity | `grep @heroui` sin resultados; suite verde |

## Mapa de componentes

| HeroUI (hoy) | shadcn/ui |
|---|---|
| `Card` | `card` |
| `Button`, `CloseButton` | `button` |
| `Chip` | `badge` |
| `Typography` | clases de Tailwind (sin componente) |
| `Tooltip` | `tooltip` |
| `TextField`, `Input`, `TextArea`, `FieldError` | `input`, `textarea`, `label`, `form` (react-hook-form + zod, ya usado) |
| `Select`, `ListBox`, `Popover` | `select`, `command`, `popover`, `dropdown-menu` |
| `Switch` | `switch` |
| `Modal` | `dialog` (y `alert-dialog` para confirmaciones) |
| `Drawer` | `drawer` (vaul) / `sheet` |
| `Table` | `table` + `data-table` (TanStack Table) |
| `Pagination` | `pagination` |
| `Alert`, notificaciones propias | `alert`, `sonner` |
| `Skeleton`, `Spinner` | `skeleton`, icono `Loader2` animado |
| `SearchField` | `input` + icono, o `command` |
| `RangeCalendar` | `calendar` en modo rango |
| Menú lateral propio y barra inferior | `sidebar` (+ barra inferior propia con `drawer`) |
| `Tabs`/segmentados propios | `tabs`, `toggle-group` |
| Iconos `@gravity-ui/icons` y SVG propios | `lucide-react` |

## Riesgos

- **Tamaño:** ~59 archivos y 21 specs (16 atados a la estructura de HeroUI: roles y `data-slot`); cada fase termina en verde para poder pausar.
- **Colisión de tokens:** se resuelve con el puente y el codemod; se verifica con capturas.
- **Radix y Cypress:** los diálogos y menús de Radix se montan en un portal; los selectores de los specs se actualizan por fase.
- **Dependencias nuevas:** esta decisión las aprueba explícitamente el usuario (regla del proyecto).
- **Mantenimiento:** el código de `ui/` es nuestro; se actualiza con `shadcn add --overwrite` revisando el diff.

## Estado

Registrado en [`backlog-diseno.md`](./backlog-diseno.md) como tareas `S-00` a `S-06`.
