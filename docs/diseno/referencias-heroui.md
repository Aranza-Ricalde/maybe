# Referencias de HeroUI

Templates oficiales de HeroUI Pro que el usuario compartió como referencia (2026-10-07):

- **Finanzas:** https://template-4.heroui.pro (rutas: Dashboard, Portfolio, Spending, Transactions, Earn, Settings)
- **Dashboard:** https://template-dashboard.heroui.pro (rutas: Dashboard, Orders, Tracker, Analytics, Settings)

## Cómo se leyeron (y qué no se sabe)

Se leyeron como **texto** (no como imágenes renderizadas). Por eso **no se evaluó** su aspecto visual (espaciado, radios, color), su modo oscuro ni su comportamiento en móvil: la lectura no mostró notas responsive. Antes de copiar decisiones visuales conviene abrirlos en el navegador, en escritorio y en móvil. Además, sus componentes "Pro" requieren licencia; aquí se rescatan **patrones**, no código.

## Patrones observados (aplicables a Maybe)

| Patrón | Qué muestran | Aplicación en Maybe |
|---|---|---|
| Barra superior con saludo y acciones rápidas | "Good afternoon, Fred" + Swap/Receive/Send | Saludo + "Registrar movimiento" (ya existe en Resumen); extender a todas las pantallas con `PageLayout` |
| Menú lateral agrupado | Rutas principales; "Help & Information" y "Log out" al fondo; etiqueta "New" en una ruta | Agrupar el menú (Panorama, Dinero, Planeación, Análisis) con Configuración y Salir al fondo; badge "Nuevo" para Importar estados |
| Bloques de KPI con variación | Cifra grande + cambio porcentual coloreado (+5.32%) | `MetricBlock` con variación y tono semántico |
| Selector de periodo como pestañas | 1D, 1W, 1M, 3M, 1Y, All / 7D 30D 90D 12M | Atajos del Explorador (30 días, 3 meses, 6 meses, 12 meses) como `Tabs`/`ToggleButtonGroup` |
| Gasto por categoría con dona y porcentajes | Dona con categorías y %; lista | Ya tenemos barras por categoría; evaluar dona solo si aporta |
| Lista de transacciones agrupada por fecha | Comercio, categoría, cuenta y monto, agrupado por día | Movimientos agrupado por día (D-17); versión móvil como lista |
| Tablas con barra de herramientas | Filter, Sort, Columns | `DataTable` con `Toolbar` de filtros y orden |
| Iconos/avatares por activo | Icono identifica cada activo | `Avatar` para cuentas y comercios |
| Exportar | "Download CSV" | Exportar movimientos a CSV (idea, no pedida) |
| Tarjetas de resumen con etiquetas claras | Total, mayor, promedio, número, rango | Resumen del Explorador con la misma estructura |

Detalles que NO se pudieron confirmar: navegación móvil (¿hoja, barra inferior?), radios, sombras, tipografía y paleta.

## Componentes HeroUI v3.2.6 disponibles (instalados)

accordion, alert, alert-dialog, autocomplete, avatar, avatar-group, badge, breadcrumbs, button, button-group, calendar, calendar-year-picker, card, checkbox, checkbox-group, chip, close-button, color-*, combo-box, date-field, date-input-group, date-picker, date-range-picker, description, disclosure, disclosure-group, drawer, dropdown, empty-state, error-message, field-error, fieldset, form, header, input, input-group, input-otp, kbd, label, link, list-box, menu, meter, modal, number-field, pagination, popover, progress-bar, progress-circle, radio, radio-group, range-calendar, scroll-shadow, search-field, select, separator, skeleton, slider, spinner, surface, switch, switch-group, table, tabs, tag, tag-group, textarea, textfield, time-field, toast, toggle-button, toggle-button-group, toolbar, tooltip, typography.

No hay `Sidebar` ni `Navbar` libres en la versión instalada: el menú se compone a mano con estos bloques (o se replica el patrón de los templates sin copiar su código Pro).
