# HeroUI y Tailwind

HeroUI trae sombras y radios generosos que dan aire de template. La app se formaliza con un tema propio, no con parches por componente.

## Qué auditar en el tema

- Existe un tema propio en el plugin `heroui()` de `tailwind.config`, con colores definidos para `light` y `dark`. Si solo se usan los valores por defecto, es hallazgo alto.
- Radios contenidos (6 a 10 px) definidos como token, no `rounded-3xl` suelto.
- `fontFamily` propio cargado con `next/font`, con fallback.
- Colores semánticos de dinero definidos una sola vez (ingreso, gasto, deuda, ahorro, alerta, sobre presupuesto) y reutilizados en tablas, chips, barras y gráficas. Buscar hex o clases de color sueltas que los dupliquen.
- Escala de espaciado y tipográfica consistente. Buscar `text-[13px]`, `p-[17px]` y valores arbitrarios repetidos.

## Uso de componentes

- `Card`: preferir `shadow="none"` con borde fino, o un `div` con borde inferior. Contar los `Card` con sombra por pantalla.
- Variantes sobrias (`flat`, `light`, `bordered`) en lugar de `solid` y `shadow` en botones, chips y tabs.
- Un solo `Button` con `color="primary"` y variante `solid` por contexto.
- `Table`: encabezado fijo, celdas numéricas con `text-right tabular-nums`, `aria-label` presente.
- `Progress` delgado para presupuestos. `Chip` solo para estados. `Tabs` para alternar vistas del mismo dato (flujo semanal dentro de evolución).
- `Drawer` para crear y editar, con `placement` adaptado a móvil. Revisar si hay `Modal` centrado donde un Drawer funcionaría mejor.
- `Skeleton` con la forma real del contenido, usado en los `loading.tsx`.

## Modo oscuro

- Superficies por luminosidad (fondo, superficie, superficie elevada), bordes sutiles, sin negro puro.
- Colores semánticos con contraste AA en ambos modos.
- Gráficas y sus ejes adaptados al tema, no fijos en colores de modo claro.

## Detecciones útiles

Búsquedas sugeridas para encontrar violaciones de forma sistemática:

- `shadow-` y `shadow=` para contar sombras.
- `rounded-` fuera de tokens.
- `#[0-9a-fA-F]{3,6}` y `rgb(` en componentes.
- `text-\[` y `p-\[` o `m-\[` con valores arbitrarios.
- `<Card` por archivo, para medir densidad de cards por pantalla.
- `color="primary"` por vista, para contar botones primarios.
- `w-\[[0-9]+px\]` y `min-w-` fijos, para encontrar anchos rígidos.
- `hover:` sin equivalente táctil.