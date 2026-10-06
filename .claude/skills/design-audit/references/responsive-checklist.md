# Checklist responsive

Breakpoints mínimos: 320, 375, 768, 1024, 1440 y 1920 px. En móvil y tableta, vertical y horizontal. Cada pantalla se evalúa en cada breakpoint y se registra como OK, con problemas o NO VERIFICADO.

## 1. Layout
- Sin scroll horizontal de página en ningún ancho.
- Sin elementos desbordados, cortados o superpuestos.
- Flex y grid con unidades relativas, `max-w-*` y contenedores fluidos en lugar de anchos fijos en px.
- Grids que colapsan de columnas múltiples a una sin saltos bruscos.

## 2. Navegación
- Menú lateral con comportamiento definido por breakpoint: expandido, contraído (ya existe) y drawer o bottom nav en móvil.
- Accesible con una mano, sin depender de hover.
- Botón "Salir" alcanzable en móvil.

## 3. Tablas y datos densos
Pantallas críticas: Movimientos, Presupuestos (árbol), Cuentas, Recurrentes, Metas, estadísticas de Gasto por categoría.
- Estrategia explícita por breakpoint: lista de filas, scroll contenido dentro de su propio contenedor, o columnas priorizadas.
- Nunca una tabla que rompa el ancho de la página.
- Paginación y filtros usables con el pulgar.

## 4. Gráficas
- Se redimensionan con el contenedor.
- Ejes, etiquetas, tooltips y leyendas legibles a 320 px.
- Selectores de rango y métricas (Evolución financiera) no desbordan.

## 5. Formularios y overlays
- Inputs cómodos de tamaño. Mínimo 16 px de fuente en inputs para evitar el zoom de iOS.
- `type` e `inputmode` correctos para montos, fechas y email.
- Modales y drawers no exceden el viewport y hacen scroll interno. En móvil se prefiere bottom sheet.
- El teclado virtual no tapa el botón de enviar.

## 6. Táctil
- Áreas de toque de al menos 44x44 px.
- Espacio suficiente entre acciones de fila (editar, eliminar, pausar).
- Ninguna acción disponible solo con hover.

## 7. Selectores de periodo y filtros
- El selector de quincenas del Resumen y Presupuestos funciona en 320 px.
- Los filtros de Movimientos colapsan a un panel en móvil.

## 8. Técnico
- Meta viewport correcto.
- `dvh` en lugar de `vh` para alturas de pantalla completa.
- Safe areas (`env(safe-area-inset-*)`) en barra inferior y headers fijos.
- Texto sin truncar información importante (montos, fechas, nombres de cuenta). Truncar solo con tooltip o forma de ver el completo.
- Imágenes y logos responsivos.