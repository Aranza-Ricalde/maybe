# Mapa de pantallas (referencia de inventario)

Descripción previa de la app, hecha a partir de leer los `page.tsx`, las plantillas y el menú. El detalle interno de las tarjetas se dedujo por nombre, así que verifica contra el código real. Si algo no coincide, el código manda y se reporta la diferencia.

Estructura: layout autenticado `(app)/layout.tsx` con `AppShell` y menú lateral contraíble. Páginas como Server Components con `loading.tsx` propio. Resumen y Presupuestos trabajan por quincenas con `?periods=1,2`. Hay 3 rutas de API sin interfaz.

| Ruta | Menú | Contenido | Composición actual | Riesgo de diseño |
|---|---|---|---|---|
| /login | — | Email y contraseña | Tarjeta centrada con logo "M" | Aspecto genérico |
| / | Resumen | Dashboard del periodo | 13 bloques apilados | Sobrecarga, sin foco único |
| /accounts | Cuentas | Cuentas y saldos, historial | Tabla y tarjeta de exploración | Tabla en móvil |
| /transactions | Movimientos | Todos los movimientos | Tabla paginada con filtros | Tabla y filtros en móvil, aviso de transferencias |
| /budgets | Presupuestos | Presupuesto por categoría | Tabla en árbol y selector de periodos | Árbol en móvil |
| /spending | Gasto por categoría | Gasto mes a mes | Tarjetas de análisis y tabla | Densidad de cards, gráficas en móvil |
| /recurring | Recurrentes | Pagos fijos | Encabezado, avisos, candidatos, tabla | Avisos dispersos |
| /projection | Proyección | Proyección de saldo y simulador | Tarjeta y simulador | Gráfica y formulario en móvil |
| /goals | Metas | Objetivos de ahorro | Tabla de metas | Podría ser lista de objetos, no tabla |
| /settings | Configuración | Usuario, categorías, quincenas | Plantilla de dos secciones | Gestión de categorías en móvil |

## Resumen (/), orden actual de bloques
1. Encabezado con saludo y selector de quincenas
2. Disponible para gastar, con modal de detalle
3. Saldos y deuda
4. Patrimonio
5. Insights
6. Flujo del periodo
7. Flujo semanal
8. Calendario financiero
9. Presupuesto por categoría
10. Evolución financiera
11. Candidatos recurrentes
12. Sugerencias de concepto
13. Actividad reciente

## Avisos de "por revisar" repartidos hoy
- Transferencias por revisar (Movimientos)
- Decisión de presupuesto de recurrentes (Presupuestos y Recurrentes)
- Candidatos recurrentes (Resumen y Recurrentes)
- Sugerencias de concepto (Resumen)