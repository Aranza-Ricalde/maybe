# Dirección de diseño

Referentes de tono: Mercury, Monarch, Copilot, Linear y la banca privada bien hecha. Sobrio, preciso, con intención. Esta es la vara contra la que se mide cada pantalla.

## Principios

1. **El número manda.** Cifras clave grandes, con `tabular-nums`, alineadas a la derecha en tablas y con los centavos en menor peso. Una sola cifra héroe por pantalla. En el Resumen es "Disponible para gastar".
2. **Las superficies se ganan.** Una card solo existe si el contenido es un objeto discreto (una cuenta, una meta). Las secciones se separan con espacio, líneas finas y títulos, no con cajas. Se usan menos cards, no cards mejor decoradas.
3. **El color significa algo.** Base neutra, un solo acento de marca y colores semánticos reservados al dinero: ingreso, gasto, sobre presupuesto, alerta. Tonos apagados. El rojo intenso solo para lo que requiere acción. Si todo es rojo o verde, nada destaca.
4. **Tipografía con carácter.** Una sans de calidad (Geist o Inter) para la UI. Opcional: una serif elegante (Instrument Serif, Fraunces) solo para la cifra héroe y títulos de página.
5. **Consistencia semántica.** El gasto siempre es el mismo tono en tablas, gráficas, chips y barras. Igual para ingreso, deuda y ahorro.

## Anti-patrones a detectar

- Todo resuelto con cajas idénticas con sombra y botones del mismo peso.
- Más de un botón primario en el mismo contexto.
- Cifras en el mismo tamaño y peso que las etiquetas.
- Avisos y alertas repartidos en varias pantallas compitiendo por atención.
- Sombras pesadas, gradientes, emojis decorativos o animaciones llamativas.
- Negro puro en modo oscuro.
- Gráficas con cuadrícula pesada, leyendas lejanas a la serie o eje Y truncado sin aviso.

## Resumen: composición esperada

La pantalla hoy apila 13 bloques. La composición objetivo:

1. Banda superior sin card: saludo, selector de quincenas y "Disponible para gastar" en grande, con runway y compromisos próximos como texto secundario en la misma línea.
2. Tira de KPIs con divisores verticales (saldo, deuda, patrimonio, tasa de ahorro, fondo de emergencia), no cinco cards.
3. Bloque principal: evolución financiera ancha, con flujo semanal como pestaña.
4. Dos columnas: calendario financiero y presupuesto por categoría.
5. Un solo buzón "Pendientes por revisar" que unifique candidatos recurrentes, sugerencias de concepto, transferencias por revisar y decisiones de presupuesto, con contador.
6. Insights como una o dos frases bajo el encabezado, no una tarjeta.
7. Actividad reciente como lista simple al final o panel lateral.

## Navegación esperada

Menú lateral agrupado:

- Panorama: Resumen, Proyección
- Dinero: Cuentas, Movimientos
- Planeación: Presupuestos, Recurrentes, Metas
- Análisis: Gasto por categoría
- Al fondo: Configuración y Salir

Móvil: barra inferior con 4 destinos (Resumen, Movimientos, Presupuestos, Más) y el resto en una hoja.

## Patrones por tipo de contenido

- **Tablas**: densas pero respirables, encabezados fijos, acciones al pasar el cursor y siempre visibles en táctil, números a la derecha.
- **Movimientos en móvil**: lista agrupada por día con comercio, categoría y monto, no tabla comprimida.
- **Presupuestos**: árbol colapsable con barras de progreso delgadas. En móvil, una fila por categoría con barra y monto.
- **Crear y editar**: Drawer lateral en desktop, bottom sheet en móvil, en lugar de modales centrados.
- **Estados vacíos**: una frase útil y una acción. **Carga**: Skeletons con la forma real del contenido.
- **Login**: pantalla dividida (formulario y panel de marca sobrio) o tipografía sobre fondo limpio, no tarjeta centrada con logo.
- **Modo oscuro**: grises profundos con bordes sutiles, jerarquía de superficies por luminosidad, nunca negro puro.